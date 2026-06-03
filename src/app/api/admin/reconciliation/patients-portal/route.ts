import 'server-only'
import { NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { listArchivedPatientSummaries, listPatients } from '@/lib/aws/dynamodb'
import { listPortalUsers } from '@/lib/aws/cognito-admin'

const ORG_ID = 'midland-sleep'

type PortalAccountStatus =
  | 'linked'
  | 'no_portal_account'
  | 'portal_account_without_patient'
  | 'archived'
  | 'unknown'

type PasswordStatus = 'temp' | 'changed' | 'unknown'

type CleanupHint =
  | 'likely_test_demo'
  | 'no_portal_account'
  | 'linked_portal_account'
  | 'needs_manual_review'

const TEST_DEMO_PATTERNS = [
  'test',
  'demo',
  'generated',
  'auto clean',
  'portal block',
  'portal required',
  'history test',
  'deploy history',
  'phase one',
]

function normalizeMsid(msid?: string): string {
  const value = (msid ?? '').trim()
  if (!value) return ''
  return value.startsWith('MS-') ? value : `MS-${value}`
}

function sourceLabel(source?: string): string {
  if (source === 'admin_csv') return 'admin_csv'
  if (source) return source
  return 'dynamodb/manual'
}

function passwordStatusFromUserStatus(userStatus?: string): PasswordStatus {
  if (userStatus === 'FORCE_CHANGE_PASSWORD') return 'temp'
  if (userStatus) return 'changed'
  return 'unknown'
}

function isLikelyTestDemo(name: string): boolean {
  const normalized = name.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
  return TEST_DEMO_PATTERNS.some((pattern) => normalized.includes(pattern))
}

function cleanupHint(name: string, status: PortalAccountStatus): CleanupHint {
  if (isLikelyTestDemo(name)) return 'likely_test_demo'
  if (status === 'no_portal_account') return 'no_portal_account'
  if (status === 'linked') return 'linked_portal_account'
  return 'needs_manual_review'
}

export async function GET() {
  const user = await getAdminUser()
  if (!user || !isAuthorizedAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [patients, portalUsers, archivedPatients] = await Promise.all([
      listPatients(ORG_ID),
      listPortalUsers(),
      listArchivedPatientSummaries(ORG_ID),
    ])

    const archivedMsids = new Set(archivedPatients.map((patient) => normalizeMsid(patient.portal_id)))
    const activePortalUsers = portalUsers.filter((user) => !archivedMsids.has(normalizeMsid(user.msid)))
    const activePatientMsids = new Set(patients.map((patient) => normalizeMsid(patient.portal_id)))
    const activePortalMsids = new Set(activePortalUsers.map((user) => normalizeMsid(user.msid)))

    const patientRows = patients.map((patient) => {
      const msid = normalizeMsid(patient.portal_id)
      const portalUser = activePortalUsers.find((user) => normalizeMsid(user.msid) === msid)
      const portalAccountStatus: PortalAccountStatus = portalUser ? 'linked' : 'no_portal_account'
      return {
        patientName: patient.name,
        msid,
        source: sourceLabel(patient.import_source),
        createdAt: patient.created_at ?? '',
        portalAccountStatus,
        passwordStatus: portalUser ? passwordStatusFromUserStatus(portalUser.userStatus) : 'unknown',
        cleanupHint: cleanupHint(patient.name, portalAccountStatus),
      }
    })

    const portalOnlyRows = activePortalUsers
      .filter((user) => !activePatientMsids.has(normalizeMsid(user.msid)))
      .map((user) => {
        const patientName = user.name || normalizeMsid(user.msid)
        const portalAccountStatus: PortalAccountStatus = 'portal_account_without_patient'
        return {
          patientName,
          msid: normalizeMsid(user.msid),
          source: 'cognito_only',
          createdAt: user.createdAt,
          portalAccountStatus,
          passwordStatus: passwordStatusFromUserStatus(user.userStatus),
          cleanupHint: cleanupHint(patientName, portalAccountStatus),
        }
      })

    const archivedRows = archivedPatients.map((patient) => {
      const portalAccountStatus: PortalAccountStatus = 'archived'
      return {
        patientName: patient.name,
        msid: normalizeMsid(patient.portal_id),
        source: 'archived_patient',
        createdAt: patient.archived_at,
        portalAccountStatus,
        passwordStatus: 'unknown' as PasswordStatus,
        cleanupHint: cleanupHint(patient.name, portalAccountStatus),
      }
    })

    return NextResponse.json({
      summary: {
        totalActivePatients: patients.length,
        totalActivePortalAccounts: activePortalUsers.length,
        patientsWithLinkedPortalAccount: patients.filter((patient) => activePortalMsids.has(normalizeMsid(patient.portal_id))).length,
        patientsWithoutPortalAccount: patients.filter((patient) => !activePortalMsids.has(normalizeMsid(patient.portal_id))).length,
        portalAccountsWithoutActivePatientRecord: portalOnlyRows.length,
        archivedPatientsExcludedFromActiveLists: archivedPatients.length,
      },
      rows: [...patientRows, ...portalOnlyRows, ...archivedRows],
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load reconciliation report' }, { status: 500 })
  }
}
