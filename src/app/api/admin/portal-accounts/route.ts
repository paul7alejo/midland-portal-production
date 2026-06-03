import 'server-only'
import { type NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { getPortalUser, listPortalUsers } from '@/lib/aws/cognito-admin'
import { listArchivedPatientSummaries } from '@/lib/aws/dynamodb'
import type { PortalAccount } from '@/components/admin/PortalAccountsTable'

const ORG_ID = 'midland-sleep'

const MSID_RE = /^MS-\d+$/

function toPortalAccount(u: { username: string; msid: string; name: string; enabled: boolean; userStatus: string; createdAt: string }): PortalAccount {
  return {
    id:             u.username,
    name:           u.name || u.msid,
    msid:           u.msid,
    nhiMasked:      '—',
    createdAt:      u.createdAt,
    passwordStatus: u.userStatus === 'FORCE_CHANGE_PASSWORD' ? 'temp' : 'changed',
    twoFa:          false,
    accountStatus:  u.enabled ? 'active' : 'locked',
  }
}

export async function GET(request: NextRequest) {
  const user = await getAdminUser()
  if (!user || !isAuthorizedAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const msidParam = request.nextUrl.searchParams.get('msid')

  // Targeted single-account lookup (used by patient drawer)
  if (msidParam !== null) {
    if (!MSID_RE.test(msidParam)) {
      return NextResponse.json({ error: 'Valid MSID is required' }, { status: 400 })
    }
    try {
      const [u, archivedSummaries] = await Promise.all([
        getPortalUser(msidParam),
        listArchivedPatientSummaries(ORG_ID),
      ])
      const archivedMsids = new Set(archivedSummaries.map(p => p.portal_id))
      if (archivedMsids.has(msidParam)) {
        return NextResponse.json({ account: null, archived: true })
      }
      return NextResponse.json({ account: u ? toPortalAccount(u) : null })
    } catch {
      return NextResponse.json({ error: 'Failed to load account' }, { status: 500 })
    }
  }

  // Full list for portal accounts page — exclude archived accounts
  try {
    const [users, archivedSummaries] = await Promise.all([
      listPortalUsers(),
      listArchivedPatientSummaries(ORG_ID),
    ])
    const archivedMsids = new Set(archivedSummaries.map(p => p.portal_id))
    const activeAccounts = users
      .filter(u => !archivedMsids.has(u.msid))
      .map(toPortalAccount)
    return NextResponse.json({ accounts: activeAccounts })
  } catch {
    return NextResponse.json({ error: 'Failed to load portal accounts' }, { status: 500 })
  }
}
