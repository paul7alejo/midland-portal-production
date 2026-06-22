import 'server-only'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { NativeAttributeValue } from '@aws-sdk/lib-dynamodb'
import { randomInt, randomUUID } from 'crypto'
import type { OrderChannel, OrderLine } from '@/types'

const TABLES = {
  PATIENTS:    'midland-sleep-patients',
  DEVICES:     'midland-sleep-devices',
  MASKS:       'midland-sleep-masks',
  ENTITLEMENT: 'midland-sleep-entitlement',
  ORDERS:      'midland-sleep-orders',
  AUDIT:       'midland-sleep-audit',
  COMMS:       'midland-sleep-comms',
} as const

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.DYNAMODB_REGION ?? 'ap-southeast-2',
    ...(process.env.MIDLAND_ACCESS_KEY_ID && {
      credentials: {
        accessKeyId: process.env.MIDLAND_ACCESS_KEY_ID,
        secretAccessKey: process.env.MIDLAND_SECRET_ACCESS_KEY!,
      },
    }),
  }),
  { marshallOptions: { removeUndefinedValues: true } }
)

// ── Record types ──────────────────────────────────────────────────────────────

export interface PatientAddressStructured {
  line1?: string
  line2?: string
  suburb?: string
  city?: string
  region?: string
  postal_code?: string
  country?: string
}

export interface PatientRecord {
  pk: string         // USER#uuid
  sk: 'PROFILE'
  patient_id: string
  portal_id: string  // MSID
  org_id: string
  name: string
  email: string
  date_of_birth?: string
  phone?: string
  address?: string
  address_structured?: PatientAddressStructured
  gender?: string
  funded_by?: string
  nhi_encrypted?: string
  nhi_hash?: string
  import_batch_id?: string
  import_row_number?: number
  import_source?: 'admin_csv'
  import_status?: 'imported'
  review_status?: 'pending_review' | 'reviewed'
  reviewed_at?: string
  reviewed_by?: string
  reviewed_by_email?: string
  needs_outreach?: boolean
  outreach_status?: 'needed' | 'not_needed'
  outreach_updated_at?: string
  outreach_updated_by?: string
  outreach_updated_by_email?: string
  safety_check_required?: boolean
  safety_status?: 'required' | 'cleared'
  safety_caution_reason?: string
  safety_severity?: 'low' | 'medium' | 'high'
  safety_due_date?: string
  safety_assigned_to?: string
  safety_resolved_note?: string
  safety_updated_at?: string
  safety_updated_by?: string
  safety_updated_by_email?: string
  updated_at?: string
  updated_by?: string
  updated_by_email?: string
  created_at?: string
  created_by?: string
  // Archive / soft-delete fields (set by portal account delete flow)
  archive_status?: 'archived'
  archived_at?: string
  archived_by?: string
  archived_by_email?: string
  archive_source?: string
  archive_reason?: string
  purge_after?: string
}

export interface DeviceRecord {
  pk: string         // DEVICE#id
  sk: string         // PATIENT#patientId
  org_id: string
  device_id: string
  patient_id: string
  name: string
  brand: string
  model: string
  serial_number: string
  setup_date: string
  image_url?: string
  funded_by?: string
  import_batch_id?: string
  import_row_number?: number
  import_source?: 'admin_csv'
  import_status?: 'imported'
  review_status?: 'pending_review'
  created_at?: string
  created_by?: string
}

export interface MaskRecord {
  pk: string         // MASK#id
  sk: string         // PATIENT#patientId
  org_id: string
  mask_id: string
  patient_id: string
  name: string
  brand: string
  model?: string
  type: 'full_face' | 'nasal' | 'nasal_pillows'
  size: string
  fitted_date: string
  image_url?: string
  import_batch_id?: string
  import_row_number?: number
  import_source?: 'admin_csv'
  import_status?: 'imported'
  review_status?: 'pending_review'
  created_at?: string
  created_by?: string
}

export interface EntitlementRecord {
  pk: string         // PATIENT#patientId
  sk: string         // YEAR#year
  org_id: string
  patient_id: string
  year: number
  items: Array<{
    item_type: string
    status: 'ELIGIBLE' | 'NOT_YET' | 'EXHAUSTED'
    next_eligible_date?: string
    quantity_remaining: number
    quantity_cap: number
  }>
}

// PURCHASE is excluded — not permitted in Phase 1B
export interface NewOrder {
  patient_id: string
  channel: OrderChannel
  order_type: 'ENTITLEMENT' | 'MIXED'
  items: OrderLine[]
}

export interface AuditEntry {
  userId: string
  event_type: string
  [key: string]: unknown
}

export interface CommsRecord {
  patient_id: string
  org_id: string
  comm_type: string
  [key: string]: unknown
}

export type PatientPortalUpdateStatus = ReorderStatus

export interface PatientPortalUpdateRecord {
  notification_id: string
  org_id: string
  patient_msid: string
  request_id: string
  request_reference?: string
  type: 'request_status_update'
  request_status: PatientPortalUpdateStatus
  title: string
  message: string
  channel: 'portal'
  delivery_status: 'visible'
  created_at: string
  read_at: string | null
  // Optional in-app navigation target for this notification (e.g.
  // "/portal/profile?notice=address-updated"). Absent on older records and
  // on notifications where the generic supply-request destination is fine.
  link_target?: string
}

export type ImportedPatientSummary = Pick<
  PatientRecord,
  | 'patient_id'
  | 'portal_id'
  | 'org_id'
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'address_structured'
  | 'gender'
  | 'date_of_birth'
  | 'funded_by'
  | 'import_batch_id'
  | 'import_row_number'
  | 'import_status'
  | 'review_status'
  | 'needs_outreach'
  | 'safety_check_required'
  | 'safety_caution_reason'
  | 'safety_severity'
  | 'safety_due_date'
  | 'safety_assigned_to'
  | 'safety_resolved_note'
  | 'safety_updated_at'
  | 'safety_updated_by_email'
  | 'created_at'
  | 'created_by'
>

export type PatientSummary = ImportedPatientSummary & Pick<PatientRecord, 'import_source'>

// ── Query functions ───────────────────────────────────────────────────────────

export async function getPatientByMSID(msid: string, orgId: string): Promise<PatientRecord | null> {
  const queryById = async (id: string) => {
    const res = await docClient.send(new QueryCommand({
      TableName: TABLES.PATIENTS,
      IndexName: 'portal_id-index',
      KeyConditionExpression: 'portal_id = :msid',
      FilterExpression: 'org_id = :orgId',
      ExpressionAttributeValues: { ':msid': id, ':orgId': orgId },
      Limit: 1,
    }))
    const item = res.Items?.[0] as PatientRecord | undefined
    if (!item) return null
    // If the GSI uses a non-ALL projection, patient_id may be absent.
    // Derive it from the pk ("USER#<patient_id>") so callers always have a valid patient_id.
    if (!item.patient_id && typeof item.pk === 'string' && item.pk.startsWith('USER#')) {
      item.patient_id = item.pk.slice(5)
    }
    return item
  }
  // Try canonical "MS-XXXXXX" format first, then bare digits as fallback.
  // Cognito custom:msid may be stored without the prefix on older/manual accounts.
  const withPrefix = msid.startsWith('MS-') ? msid : `MS-${msid}`
  return (await queryById(withPrefix)) ?? (await queryById(withPrefix.slice(3)))
}

// Admin-editable patient fields only — NHI, MSID (portal_id), and date_of_birth
// are intentionally excluded from this function's parameter shape so they can
// never be written through this path, regardless of caller input.
export async function updateAdminPatientDetails(params: {
  pk: string
  fields: {
    name?: string
    phone?: string
    email?: string
    gender?: string
    address?: string
    address_structured?: PatientAddressStructured
  }
  adminSub: string
  adminEmail: string
}): Promise<void> {
  const now = new Date().toISOString()
  const entries = Object.entries(params.fields).filter(([, value]) => value !== undefined)

  const ExpressionAttributeNames: Record<string, string> = {
    '#updated_at': 'updated_at',
    '#updated_by': 'updated_by',
    '#updated_by_email': 'updated_by_email',
  }
  const ExpressionAttributeValues: Record<string, unknown> = {
    ':now': now,
    ':sub': params.adminSub,
    ':email': params.adminEmail,
  }
  const setClauses: string[] = ['#updated_at = :now', '#updated_by = :sub', '#updated_by_email = :email']

  for (const [key, value] of entries) {
    ExpressionAttributeNames[`#${key}`] = key
    ExpressionAttributeValues[`:${key}`] = value
    setClauses.push(`#${key} = :${key}`)
  }

  await docClient.send(new UpdateCommand({
    TableName: TABLES.PATIENTS,
    Key: { pk: params.pk, sk: 'PROFILE' },
    ConditionExpression: 'attribute_exists(pk)',
    UpdateExpression: `SET ${setClauses.join(', ')}`,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  }))
}

export async function listImportedPatients(orgId: string): Promise<ImportedPatientSummary[]> {
  const patients: ImportedPatientSummary[] = []
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined

  do {
    const res = await docClient.send(new ScanCommand({
      TableName: TABLES.PATIENTS,
      FilterExpression: 'org_id = :orgId AND import_source = :importSource',
      ExpressionAttributeValues: {
        ':orgId': orgId,
        ':importSource': 'admin_csv',
      },
      ProjectionExpression: [
        '#patientId',
        '#portalId',
        '#orgId',
        '#name',
        '#email',
        '#phone',
        '#address',
        '#addressStructured',
        '#dateOfBirth',
        '#fundedBy',
        '#importBatchId',
        '#importRowNumber',
        '#importStatus',
        '#reviewStatus',
        '#needsOutreach',
        '#safetyCheckRequired',
        '#safetyCautionReason',
        '#safetySeverity',
        '#safetyDueDate',
        '#safetyAssignedTo',
        '#safetyResolvedNote',
        '#safetyUpdatedAt',
        '#safetyUpdatedByEmail',
        '#createdAt',
        '#createdBy',
      ].join(', '),
      ExpressionAttributeNames: {
        '#patientId': 'patient_id',
        '#portalId': 'portal_id',
        '#orgId': 'org_id',
        '#name': 'name',
        '#email': 'email',
        '#phone': 'phone',
        '#address': 'address',
        '#addressStructured': 'address_structured',
        '#dateOfBirth': 'date_of_birth',
        '#fundedBy': 'funded_by',
        '#importBatchId': 'import_batch_id',
        '#importRowNumber': 'import_row_number',
        '#importStatus': 'import_status',
        '#reviewStatus': 'review_status',
        '#needsOutreach': 'needs_outreach',
        '#safetyCheckRequired': 'safety_check_required',
        '#safetyCautionReason': 'safety_caution_reason',
        '#safetySeverity': 'safety_severity',
        '#safetyDueDate': 'safety_due_date',
        '#safetyAssignedTo': 'safety_assigned_to',
        '#safetyResolvedNote': 'safety_resolved_note',
        '#safetyUpdatedAt': 'safety_updated_at',
        '#safetyUpdatedByEmail': 'safety_updated_by_email',
        '#createdAt': 'created_at',
        '#createdBy': 'created_by',
      },
      ExclusiveStartKey,
    }))

    patients.push(...((res.Items ?? []) as ImportedPatientSummary[]))
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  patients.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  return patients
}

export async function listPatients(orgId: string): Promise<PatientSummary[]> {
  const patients: PatientSummary[] = []
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined

  do {
    const res = await docClient.send(new ScanCommand({
      TableName: TABLES.PATIENTS,
      FilterExpression: 'org_id = :orgId AND sk = :profileSk AND (attribute_not_exists(#archiveStatus) OR #archiveStatus <> :archived)',
      ExpressionAttributeValues: {
        ':orgId': orgId,
        ':profileSk': 'PROFILE',
        ':archived': 'archived',
      },
      ProjectionExpression: [
        '#patientId',
        '#portalId',
        '#orgId',
        '#name',
        '#email',
        '#phone',
        '#address',
        '#addressStructured',
        '#dateOfBirth',
        '#fundedBy',
        '#importSource',
        '#importBatchId',
        '#importRowNumber',
        '#importStatus',
        '#reviewStatus',
        '#needsOutreach',
        '#safetyCheckRequired',
        '#safetyCautionReason',
        '#safetySeverity',
        '#safetyDueDate',
        '#safetyAssignedTo',
        '#safetyResolvedNote',
        '#safetyUpdatedAt',
        '#safetyUpdatedByEmail',
        '#createdAt',
        '#createdBy',
      ].join(', '),
      ExpressionAttributeNames: {
        '#patientId': 'patient_id',
        '#portalId': 'portal_id',
        '#orgId': 'org_id',
        '#name': 'name',
        '#email': 'email',
        '#phone': 'phone',
        '#address': 'address',
        '#addressStructured': 'address_structured',
        '#dateOfBirth': 'date_of_birth',
        '#fundedBy': 'funded_by',
        '#importSource': 'import_source',
        '#importBatchId': 'import_batch_id',
        '#importRowNumber': 'import_row_number',
        '#importStatus': 'import_status',
        '#reviewStatus': 'review_status',
        '#needsOutreach': 'needs_outreach',
        '#safetyCheckRequired': 'safety_check_required',
        '#safetyCautionReason': 'safety_caution_reason',
        '#safetySeverity': 'safety_severity',
        '#safetyDueDate': 'safety_due_date',
        '#safetyAssignedTo': 'safety_assigned_to',
        '#safetyResolvedNote': 'safety_resolved_note',
        '#safetyUpdatedAt': 'safety_updated_at',
        '#safetyUpdatedByEmail': 'safety_updated_by_email',
        '#createdAt': 'created_at',
        '#createdBy': 'created_by',
        '#archiveStatus': 'archive_status',
      },
      ExclusiveStartKey,
    }))

    patients.push(...((res.Items ?? []) as PatientSummary[]))
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  patients.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  return patients
}

// ── Patient archive / restore / bin ──────────────────────────────────────────

export interface ArchivedPatientSummary {
  patient_id: string
  portal_id: string
  name: string
  archived_at: string
  archived_by_email: string | null
  archive_source: string
  purge_after: string
}

export async function listArchivedPatientSummaries(orgId: string): Promise<ArchivedPatientSummary[]> {
  const results: ArchivedPatientSummary[] = []
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined
  do {
    const res = await docClient.send(new ScanCommand({
      TableName: TABLES.PATIENTS,
      FilterExpression: 'org_id = :orgId AND sk = :profileSk AND #archiveStatus = :archived',
      ExpressionAttributeValues: {
        ':orgId': orgId,
        ':profileSk': 'PROFILE',
        ':archived': 'archived',
      },
      ExpressionAttributeNames: {
        '#archiveStatus': 'archive_status',
        '#name': 'name',
      },
      ProjectionExpression: 'patient_id, portal_id, #name, archived_at, archived_by_email, archive_source, purge_after',
      ExclusiveStartKey,
    }))
    results.push(...((res.Items ?? []) as ArchivedPatientSummary[]))
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)
  results.sort((a, b) => b.archived_at.localeCompare(a.archived_at))
  return results
}

export async function archivePatientByMsid(params: {
  msid: string
  adminSub: string
  adminEmail: string
  orgId: string
  archiveSource?: string
  archiveReason?: string
}): Promise<{ ok: true; patientId: string } | { ok: false; reason: 'not_found' | 'already_archived' | 'error'; message?: string }> {
  const patient = await getPatientByMSID(params.msid, params.orgId)
  if (!patient) return { ok: false, reason: 'not_found' }

  const now        = new Date().toISOString()
  const purgeAfter = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  try {
    await docClient.send(new UpdateCommand({
      TableName: TABLES.PATIENTS,
      Key: { pk: patient.pk, sk: 'PROFILE' },
      ConditionExpression: 'attribute_exists(pk) AND (attribute_not_exists(#archiveStatus) OR #archiveStatus <> :archived)',
      UpdateExpression:
        'SET archive_status = :archived, archived_at = :now, archived_by = :sub,' +
        ' archived_by_email = :email, archive_source = :source, purge_after = :purgeAfter,' +
        ' updated_at = :now, updated_by = :sub, updated_by_email = :email' +
        (params.archiveReason ? ', archive_reason = :archiveReason' : ''),
      ExpressionAttributeNames: {
        '#archiveStatus': 'archive_status',
      },
      ExpressionAttributeValues: {
        ':archived':   'archived',
        ':now':        now,
        ':sub':        params.adminSub,
        ':email':      params.adminEmail,
        ':source':     params.archiveSource ?? 'portal_account_deleted',
        ':purgeAfter': purgeAfter,
        ...(params.archiveReason ? { ':archiveReason': params.archiveReason } : {}),
      },
    }))
  } catch (err: unknown) {
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
      return { ok: false, reason: 'already_archived' }
    }
    return { ok: false, reason: 'error', message: err instanceof Error ? err.message : String(err) }
  }

  return { ok: true, patientId: patient.patient_id }
}

export async function restorePatientByMsid(params: {
  msid: string
  adminSub: string
  adminEmail: string
  orgId: string
}): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'not_archived' | 'wrong_source' | 'restore_window_expired' | 'error'; message?: string }> {
  const patient = await getPatientByMSID(params.msid, params.orgId)
  if (!patient) return { ok: false, reason: 'not_found' }

  // Get the full item directly — GSI projection may be partial
  let fullRecord: PatientRecord | undefined
  try {
    const res = await docClient.send(new GetCommand({
      TableName: TABLES.PATIENTS,
      Key: { pk: patient.pk, sk: 'PROFILE' },
    }))
    fullRecord = res.Item as PatientRecord | undefined
  } catch (err: unknown) {
    return { ok: false, reason: 'error', message: err instanceof Error ? err.message : String(err) }
  }

  if (!fullRecord || fullRecord.archive_status !== 'archived') {
    return { ok: false, reason: 'not_archived' }
  }

  if (fullRecord.archive_source !== 'portal_account_deleted') {
    return { ok: false, reason: 'wrong_source' }
  }

  if (fullRecord.purge_after && new Date(fullRecord.purge_after) < new Date()) {
    return { ok: false, reason: 'restore_window_expired' }
  }

  const now = new Date().toISOString()
  try {
    await docClient.send(new UpdateCommand({
      TableName: TABLES.PATIENTS,
      Key: { pk: patient.pk, sk: 'PROFILE' },
      ConditionExpression: 'attribute_exists(pk)',
      UpdateExpression:
        'REMOVE archive_status, archived_at, archived_by, archived_by_email, archive_source, purge_after' +
        ' SET updated_at = :now, updated_by = :sub, updated_by_email = :email',
      ExpressionAttributeValues: {
        ':now':   now,
        ':sub':   params.adminSub,
        ':email': params.adminEmail,
      },
    }))
  } catch (err: unknown) {
    return { ok: false, reason: 'error', message: err instanceof Error ? err.message : String(err) }
  }

  return { ok: true }
}

export async function getPatientByNhiHash(
  nhiHash: string,
  orgId: string
): Promise<Pick<PatientRecord, 'pk' | 'sk' | 'patient_id' | 'portal_id' | 'org_id'> | null> {
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined

  do {
    const res = await docClient.send(new ScanCommand({
      TableName: TABLES.PATIENTS,
      FilterExpression: 'nhi_hash = :nhiHash AND org_id = :orgId',
      ExpressionAttributeValues: { ':nhiHash': nhiHash, ':orgId': orgId },
      ProjectionExpression: 'pk, sk, patient_id, portal_id, org_id',
      ExclusiveStartKey,
    }))
    const item = res.Items?.[0] as
      | Pick<PatientRecord, 'pk' | 'sk' | 'patient_id' | 'portal_id' | 'org_id'>
      | undefined
    if (item) return item
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  return null
}

export async function getDeviceBySerialNumber(
  serialNumber: string,
  orgId: string
): Promise<Pick<DeviceRecord, 'pk' | 'sk' | 'device_id' | 'patient_id' | 'org_id' | 'serial_number'> | null> {
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined

  do {
    const res = await docClient.send(new ScanCommand({
      TableName: TABLES.DEVICES,
      FilterExpression: 'serial_number = :serialNumber AND org_id = :orgId',
      ExpressionAttributeValues: { ':serialNumber': serialNumber, ':orgId': orgId },
      ProjectionExpression: 'pk, sk, device_id, patient_id, org_id, serial_number',
      ExclusiveStartKey,
    }))
    const item = res.Items?.[0] as
      | Pick<DeviceRecord, 'pk' | 'sk' | 'device_id' | 'patient_id' | 'org_id' | 'serial_number'>
      | undefined
    if (item) return item
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  return null
}

export async function getPatientDevices(patientId: string, orgId: string): Promise<DeviceRecord[]> {
  const res = await docClient.send(new ScanCommand({
    TableName: TABLES.DEVICES,
    FilterExpression: 'patient_id = :patientId AND org_id = :orgId',
    ExpressionAttributeValues: { ':patientId': patientId, ':orgId': orgId },
  }))
  return (res.Items ?? []) as DeviceRecord[]
}

export async function getPatientMask(patientId: string, orgId: string): Promise<MaskRecord | null> {
  const res = await docClient.send(new ScanCommand({
    TableName: TABLES.MASKS,
    FilterExpression: 'patient_id = :patientId AND org_id = :orgId',
    ExpressionAttributeValues: { ':patientId': patientId, ':orgId': orgId },
  }))
  return (res.Items?.[0] as MaskRecord) ?? null
}

export async function getPatientEntitlement(
  patientId: string,
  year: number,
  orgId: string,
): Promise<EntitlementRecord | null> {
  const res = await docClient.send(new GetCommand({
    TableName: TABLES.ENTITLEMENT,
    Key: { pk: `PATIENT#${patientId}`, sk: `YEAR#${year}` },
  }))
  // GetCommand has no FilterExpression; enforce org isolation post-fetch
  const item = res.Item as EntitlementRecord | undefined
  if (!item || item.org_id !== orgId) return null
  return item
}

// ── Write functions ───────────────────────────────────────────────────────────

const PHASE1B_ORDER_TYPES = new Set<string>(['ENTITLEMENT', 'MIXED'])

export async function createOrder(order: NewOrder): Promise<string> {
  if (!PHASE1B_ORDER_TYPES.has(order.order_type)) {
    throw new Error(`Order type '${order.order_type}' is not permitted in Phase 1B`)
  }
  const id = randomUUID()
  const timestamp = new Date().toISOString()
  await docClient.send(new PutCommand({
    TableName: TABLES.ORDERS,
    Item: {
      pk: `USER#${order.patient_id}`,
      sk: `ORDER#${timestamp}`,
      id,
      ...order,
      status: 'PENDING',
      created_at: timestamp,
    },
  }))
  return id
}

export async function putImportedPatient(record: PatientRecord): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: TABLES.PATIENTS,
    Item: record,
    ConditionExpression: 'attribute_not_exists(pk)',
  }))
}

export async function putImportedDevice(record: DeviceRecord): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: TABLES.DEVICES,
    Item: record,
    ConditionExpression: 'attribute_not_exists(pk)',
  }))
}

export async function putImportedMask(record: MaskRecord): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: TABLES.MASKS,
    Item: record,
    ConditionExpression: 'attribute_not_exists(pk)',
  }))
}

// PutItem only — UpdateItem and DeleteItem are intentionally not exposed for this table
export async function appendAuditLog(entry: AuditEntry): Promise<void> {
  const timestamp_ms = Date.now()
  await docClient.send(new PutCommand({
    TableName: TABLES.AUDIT,
    Item: {
      pk: `AUDIT#${entry.userId}`,
      sk: `EVENT#${timestamp_ms}`,
      ...entry,
      timestamp_ms,
    },
  }))
}

export interface PatientAuditEvent {
  timestamp:  string
  action:     string
  adminEmail: string | null
  result:     string | null
  details?:   string
  sk:         string
}

// Scan-based lookup by patient_msid — no GSI exists on the audit table.
// Acceptable for small clinic volumes (< 10k audit records total).
export async function queryAuditByPatient(
  msid: string,
  limit = 20
): Promise<PatientAuditEvent[]> {
  const msidNorm = msid.startsWith('MS-') ? msid : `MS-${msid}`
  const username = msidNorm.slice(3)  // numeric portion only

  // Handle current field name (patient_msid) and older camelCase variant (patientMsid).
  // Also match by bare username in case older records stored the numeric form.
  const res = await docClient.send(new ScanCommand({
    TableName: TABLES.AUDIT,
    FilterExpression:
      'patient_msid = :msid OR patient_msid = :username' +
      ' OR patientMsid = :msid OR patientMsid = :username',
    ExpressionAttributeValues: {
      ':msid':     msidNorm,
      ':username': username,
    },
  }))

  const items = (res.Items ?? []) as Array<Record<string, unknown>>

  // Sort newest-first by sk (EVENT#timestamp_ms — lexicographic == chronological)
  items.sort((a, b) => {
    const sa = typeof a.sk === 'string' ? a.sk : ''
    const sb = typeof b.sk === 'string' ? b.sk : ''
    return sb.localeCompare(sa)
  })

  return items.slice(0, limit).map((item) => ({
    timestamp:  typeof item.timestamp   === 'string' ? item.timestamp   : '',
    action:     typeof item.action      === 'string' ? item.action
              : typeof item.event_type  === 'string' ? item.event_type
              : typeof item.eventType   === 'string' ? item.eventType
              : '',
    adminEmail: typeof item.admin_email === 'string' ? item.admin_email
              : typeof item.adminEmail  === 'string' ? item.adminEmail
              : null,
    result:     typeof item.result      === 'string' ? item.result      : null,
    details:    typeof item.details     === 'string' ? item.details     : undefined,
    sk:         typeof item.sk          === 'string' ? item.sk          : '',
  }))
}

export interface AuditEventSummary {
  sk: string
  timestamp: string
  action: string
  adminEmail: string | null
  patientMsid: string | null
  result: string | null
  details?: string
}

// Scan-based — no GSI on org_id or timestamp. Acceptable for small clinic volumes.
export async function listRecentAuditEvents(
  orgId: string,
  limit = 100,
): Promise<AuditEventSummary[]> {
  const res = await docClient.send(new ScanCommand({
    TableName: TABLES.AUDIT,
    FilterExpression: 'org_id = :orgId',
    ExpressionAttributeValues: { ':orgId': orgId },
  }))

  const items = (res.Items ?? []) as Array<Record<string, unknown>>

  items.sort((a, b) => {
    const sa = typeof a.sk === 'string' ? a.sk : ''
    const sb = typeof b.sk === 'string' ? b.sk : ''
    return sb.localeCompare(sa)
  })

  return items.slice(0, limit).map((item) => ({
    sk:          typeof item.sk           === 'string' ? item.sk : '',
    timestamp:   typeof item.timestamp    === 'string' ? item.timestamp : '',
    action:      typeof item.action       === 'string' ? item.action
               : typeof item.event_type   === 'string' ? item.event_type
               : typeof item.eventType    === 'string' ? item.eventType
               : '',
    adminEmail:  typeof item.admin_email  === 'string' ? item.admin_email
               : typeof item.adminEmail   === 'string' ? item.adminEmail
               : null,
    patientMsid: typeof item.patient_msid === 'string' ? item.patient_msid
               : typeof item.patientMsid  === 'string' ? item.patientMsid
               : null,
    result:      typeof item.result       === 'string' ? item.result : null,
    details:     typeof item.details      === 'string' ? item.details : undefined,
  }))
}

export async function countAuditEventsSince(
  userId: string,
  eventType: string,
  sinceMs: number
): Promise<number> {
  const res = await docClient.send(new QueryCommand({
    TableName: TABLES.AUDIT,
    KeyConditionExpression: 'pk = :pk AND sk BETWEEN :skStart AND :skEnd',
    FilterExpression: 'event_type = :eventType',
    ExpressionAttributeValues: {
      ':pk': `AUDIT#${userId}`,
      ':skStart': `EVENT#${sinceMs}`,
      ':skEnd': `EVENT#${Date.now()}`,
      ':eventType': eventType,
    },
    Select: 'COUNT',
  }))
  return res.Count ?? 0
}

export async function updatePatientProfile(
  pk: string,
  fields: { name?: string; email?: string; address_structured?: PatientAddressStructured; address?: string }
): Promise<void> {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return
  const ExpressionAttributeNames: Record<string, string> = {}
  const ExpressionAttributeValues: Record<string, unknown> = {}
  const setClauses: string[] = []
  for (const [key, value] of entries) {
    ExpressionAttributeNames[`#${key}`] = key
    ExpressionAttributeValues[`:${key}`] = value
    setClauses.push(`#${key} = :${key}`)
  }
  await docClient.send(new UpdateCommand({
    TableName: TABLES.PATIENTS,
    Key: { pk, sk: 'PROFILE' },
    UpdateExpression: `SET ${setClauses.join(', ')}`,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  }))
}

export async function setPatientReviewStatus(params: {
  pk: string
  reviewStatus: 'pending_review' | 'reviewed'
  adminSub: string
  adminEmail: string
}): Promise<void> {
  const now = new Date().toISOString()
  const isReviewed = params.reviewStatus === 'reviewed'
  const UpdateExpression = isReviewed
    ? 'SET review_status = :status, reviewed_at = :now, reviewed_by = :sub, reviewed_by_email = :email, updated_at = :now, updated_by = :sub, updated_by_email = :email'
    : 'SET review_status = :status, updated_at = :now, updated_by = :sub, updated_by_email = :email'
  await docClient.send(new UpdateCommand({
    TableName: TABLES.PATIENTS,
    Key: { pk: params.pk, sk: 'PROFILE' },
    ConditionExpression: 'attribute_exists(pk)',
    UpdateExpression,
    ExpressionAttributeValues: {
      ':status': params.reviewStatus,
      ':now':    now,
      ':sub':    params.adminSub,
      ':email':  params.adminEmail,
    },
  }))
}

export async function setPatientOutreachStatus(params: {
  pk: string
  needsOutreach: boolean
  adminSub: string
  adminEmail: string
}): Promise<void> {
  const now = new Date().toISOString()
  await docClient.send(new UpdateCommand({
    TableName: TABLES.PATIENTS,
    Key: { pk: params.pk, sk: 'PROFILE' },
    ConditionExpression: 'attribute_exists(pk)',
    UpdateExpression:
      'SET needs_outreach = :flag, outreach_status = :ostatus,' +
      ' outreach_updated_at = :now, outreach_updated_by = :sub, outreach_updated_by_email = :email,' +
      ' updated_at = :now, updated_by = :sub, updated_by_email = :email',
    ExpressionAttributeValues: {
      ':flag':    params.needsOutreach,
      ':ostatus': params.needsOutreach ? 'needed' : 'not_needed',
      ':now':     now,
      ':sub':     params.adminSub,
      ':email':   params.adminEmail,
    },
  }))
}

export async function setPatientSafetyStatus(params: {
  pk: string
  safetyCheckRequired: boolean
  resolvedNote?: string
  adminSub: string
  adminEmail: string
}): Promise<void> {
  const now = new Date().toISOString()
  const setExprs = [
    'safety_check_required = :flag',
    'safety_status = :sstatus',
    'safety_updated_at = :now',
    'safety_updated_by = :sub',
    'safety_updated_by_email = :email',
    'updated_at = :now',
    'updated_by = :sub',
    'updated_by_email = :email',
  ]
  const removeExprs: string[] = []
  const values: Record<string, unknown> = {
    ':flag':    params.safetyCheckRequired,
    ':sstatus': params.safetyCheckRequired ? 'required' : 'cleared',
    ':now':     now,
    ':sub':     params.adminSub,
    ':email':   params.adminEmail,
  }
  if (!params.safetyCheckRequired && params.resolvedNote !== undefined) {
    if (params.resolvedNote.trim()) {
      setExprs.push('safety_resolved_note = :resolvedNote')
      values[':resolvedNote'] = params.resolvedNote.trim()
    } else {
      removeExprs.push('safety_resolved_note')
    }
  }
  let expr = 'SET ' + setExprs.join(', ')
  if (removeExprs.length > 0) expr += ' REMOVE ' + removeExprs.join(', ')
  await docClient.send(new UpdateCommand({
    TableName: TABLES.PATIENTS,
    Key: { pk: params.pk, sk: 'PROFILE' },
    ConditionExpression: 'attribute_exists(pk)',
    UpdateExpression: expr,
    ExpressionAttributeValues: values,
  }))
}

export async function setSafetyCautionDetails(params: {
  pk: string
  cautionReason: string
  severity: string
  dueDate: string
  assignedTo: string
  adminSub: string
  adminEmail: string
}): Promise<void> {
  const now = new Date().toISOString()
  const setExprs = [
    'safety_updated_at = :now',
    'safety_updated_by = :sub',
    'safety_updated_by_email = :email',
    'updated_at = :now',
    'updated_by = :sub',
    'updated_by_email = :email',
  ]
  const removeExprs: string[] = []
  const values: Record<string, unknown> = {
    ':now': now, ':sub': params.adminSub, ':email': params.adminEmail,
  }

  if (params.cautionReason.trim()) {
    setExprs.push('safety_caution_reason = :reason')
    values[':reason'] = params.cautionReason.trim()
  } else {
    removeExprs.push('safety_caution_reason')
  }

  const VALID_SEVERITIES = ['low', 'medium', 'high']
  if (VALID_SEVERITIES.includes(params.severity)) {
    setExprs.push('safety_severity = :severity')
    values[':severity'] = params.severity
  } else {
    removeExprs.push('safety_severity')
  }

  if (params.dueDate.trim()) {
    setExprs.push('safety_due_date = :dueDate')
    values[':dueDate'] = params.dueDate.trim()
  } else {
    removeExprs.push('safety_due_date')
  }

  if (params.assignedTo.trim()) {
    setExprs.push('safety_assigned_to = :assignedTo')
    values[':assignedTo'] = params.assignedTo.trim()
  } else {
    removeExprs.push('safety_assigned_to')
  }

  let expr = 'SET ' + setExprs.join(', ')
  if (removeExprs.length > 0) expr += ' REMOVE ' + removeExprs.join(', ')

  await docClient.send(new UpdateCommand({
    TableName: TABLES.PATIENTS,
    Key: { pk: params.pk, sk: 'PROFILE' },
    ConditionExpression: 'attribute_exists(pk)',
    UpdateExpression: expr,
    ExpressionAttributeValues: values,
  }))
}

// ── Reorder requests (Phase 1F / Phase 2D) ───────────────────────────────────

export type ReorderStatus =
  | 'new'
  | 'reviewing'
  | 'approved'
  | 'sent'
  | 'delivered'
  | 'declined'
  | 'needs_followup'

export type ReorderSource =
  | 'patient_portal'
  | 'support_request'
  | 'admin_created'
  | 'address_change'

export interface ReorderDeliveryAddress {
  line1: string
  line2?: string
  city: string
  region?: string
  postcode: string
  country: string
}

export interface ReorderRequest {
  id?: string
  request_reference?: string
  patient_id: string
  patient_msid: string
  patient_name: string
  org_id: string
  source?: ReorderSource
  items?: string[]
  delivery_address?: ReorderDeliveryAddress
  created_by: string
  item_description?: string
  reason?: string
  contact_preference?: string
  needs_funding_review?: boolean
  review_reason?: string
  // Estimate fields — Phase 2 only, no deduction applied
  estimated_amount?: number
  estimated_funded_amount?: number
  estimated_patient_copay?: number
  estimated_remaining_after?: number
  note?: string
  // Address-change requests only. requested_address is the patient's proposed
  // correction; current_address_snapshot is the admin-controlled address at
  // time of submission, kept so staff can compare before/after. Neither is
  // ever applied to the patient record automatically — uses the same
  // structured shape as the admin patient record (PatientAddressStructured),
  // not the simplified ReorderDeliveryAddress used by supply requests.
  requested_address?: PatientAddressStructured
  current_address_snapshot?: PatientAddressStructured
}

export interface ReorderRecord {
  pk: string
  sk: string
  id: string
  request_reference?: string
  patient_id: string
  patient_msid: string
  patient_name?: string
  org_id: string
  items: string[]
  delivery_address?: ReorderDeliveryAddress
  status: ReorderStatus
  source: ReorderSource
  created_by: string
  created_at: string
  // Status update tracking
  updated_at?: string
  updated_by?: string
  updated_by_email?: string
  // Funding review flag
  needs_funding_review?: boolean
  review_reason?: string
  // Support request fields
  item_description?: string
  reason?: string
  contact_preference?: string
  // Estimate fields — Phase 2 only, no deduction applied
  estimated_amount?: number
  estimated_funded_amount?: number
  estimated_patient_copay?: number
  estimated_remaining_after?: number
  note?: string
  requested_address?: PatientAddressStructured
  current_address_snapshot?: PatientAddressStructured
  // Address-change approval tracking — set only when an admin approves an
  // address_change request and the patient record is updated.
  approved_at?: string
  approved_by?: string
}

export function createRequestReference(createdAt: string): string {
  const date = new Date(createdAt)
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const yy = parts.find((part) => part.type === 'year')?.value ?? String(date.getUTCFullYear()).slice(-2)
  const mm = parts.find((part) => part.type === 'month')?.value ?? String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = parts.find((part) => part.type === 'day')?.value ?? String(date.getUTCDate()).padStart(2, '0')
  const suffix = String(randomInt(0, 1_000_000)).padStart(6, '0')
  return `REQ-${yy}${mm}${dd}-${suffix}`
}

export function normalizeReorderStatus(status: unknown): ReorderStatus {
  if (status === 'pending_review') return 'new'
  if (status === 'cancelled') return 'declined'
  if (
    status === 'new' ||
    status === 'reviewing' ||
    status === 'approved' ||
    status === 'sent' ||
    status === 'delivered' ||
    status === 'declined' ||
    status === 'needs_followup'
  ) {
    return status
  }
  return 'new'
}

export function normalizeReorderSource(source: unknown): ReorderSource {
  if (source === 'patient_portal_reorder') return 'patient_portal'
  if (source === 'support_request' || source === 'admin_created' || source === 'address_change') return source
  return 'patient_portal'
}

function normalizeReorderRecord(item: Record<string, NativeAttributeValue>): ReorderRecord {
  return {
    ...(item as unknown as ReorderRecord),
    status: normalizeReorderStatus(item.status),
    source: normalizeReorderSource(item.source),
  }
}

export async function createReorderRequest(req: ReorderRequest): Promise<ReorderRecord> {
  const id = req.id ?? randomUUID()
  const created_at = new Date().toISOString()
  const item: ReorderRecord = {
    pk: `ORDER#${id}`,
    sk: 'REORDER',
    id,
    request_reference: req.request_reference ?? createRequestReference(created_at),
    patient_id: req.patient_id,
    patient_msid: req.patient_msid,
    patient_name: req.patient_name,
    org_id: req.org_id,
    items: req.items ?? [],
    status: 'new',
    source: req.source ?? 'patient_portal',
    created_by: req.created_by,
    created_at,
    ...(req.delivery_address !== undefined && { delivery_address: req.delivery_address }),
    ...(req.item_description !== undefined && { item_description: req.item_description }),
    ...(req.reason !== undefined && { reason: req.reason }),
    ...(req.contact_preference !== undefined && { contact_preference: req.contact_preference }),
    ...(req.needs_funding_review !== undefined && { needs_funding_review: req.needs_funding_review }),
    ...(req.review_reason !== undefined && { review_reason: req.review_reason }),
    ...(req.estimated_amount !== undefined && { estimated_amount: req.estimated_amount }),
    ...(req.estimated_funded_amount !== undefined && { estimated_funded_amount: req.estimated_funded_amount }),
    ...(req.estimated_patient_copay !== undefined && { estimated_patient_copay: req.estimated_patient_copay }),
    ...(req.estimated_remaining_after !== undefined && { estimated_remaining_after: req.estimated_remaining_after }),
    ...(req.note !== undefined && { note: req.note }),
    ...(req.requested_address !== undefined && { requested_address: req.requested_address }),
    ...(req.current_address_snapshot !== undefined && { current_address_snapshot: req.current_address_snapshot }),
  }
  await docClient.send(new PutCommand({
    TableName: TABLES.ORDERS,
    Item: item,
    ConditionExpression: 'attribute_not_exists(pk)',
  }))
  return item
}

export async function listReorderRequests(orgId: string): Promise<ReorderRecord[]> {
  const results: ReorderRecord[] = []
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined
  do {
    const res = await docClient.send(new ScanCommand({
      TableName: TABLES.ORDERS,
      FilterExpression: 'org_id = :orgId AND (#src = :src1 OR #src = :src2 OR #src = :src3 OR #src = :legacySrc)',
      ExpressionAttributeNames: { '#src': 'source' },
      ExpressionAttributeValues: {
        ':orgId': orgId,
        ':src1': 'patient_portal',
        ':src2': 'support_request',
        ':src3': 'address_change',
        ':legacySrc': 'patient_portal_reorder',
      },
      ExclusiveStartKey,
    }))
    for (const item of res.Items ?? []) {
      results.push(normalizeReorderRecord(item))
    }
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)
  return results
}

export async function getPendingReorderRequest(
  patientId: string,
  orgId: string
): Promise<ReorderRecord | null> {
  const results: ReorderRecord[] = []
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined

  do {
    const res = await docClient.send(new ScanCommand({
      TableName: TABLES.ORDERS,
      FilterExpression: [
        'patient_id = :patientId',
        'org_id = :orgId',
        '(#src = :source OR #src = :legacySource)',
        '(#status = :status OR #status = :legacyStatus)',
      ].join(' AND '),
      ExpressionAttributeNames: {
        '#src': 'source',
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':patientId': patientId,
        ':orgId': orgId,
        ':source': 'patient_portal',
        ':legacySource': 'patient_portal_reorder',
        ':status': 'new',
        ':legacyStatus': 'pending_review',
      },
      ExclusiveStartKey,
    }))
    for (const item of res.Items ?? []) {
      results.push(normalizeReorderRecord(item))
    }
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  results.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return results[0] ?? null
}

export async function getLatestReorderRequest(
  patientId: string,
  orgId: string
): Promise<ReorderRecord | null> {
  const results: ReorderRecord[] = []
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined

  do {
    const res = await docClient.send(new ScanCommand({
      TableName: TABLES.ORDERS,
      FilterExpression: 'patient_id = :patientId AND org_id = :orgId AND (#src = :src1 OR #src = :src2 OR #src = :legacySrc)',
      ExpressionAttributeNames: { '#src': 'source' },
      ExpressionAttributeValues: {
        ':patientId': patientId,
        ':orgId': orgId,
        ':src1': 'patient_portal',
        ':src2': 'support_request',
        ':legacySrc': 'patient_portal_reorder',
      },
      ExclusiveStartKey,
    }))
    for (const item of res.Items ?? []) {
      results.push(normalizeReorderRecord(item))
    }
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  results.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return results[0] ?? null
}

export async function listReorderRequestsByMsid(
  msid: string,
  orgId: string
): Promise<ReorderRecord[]> {
  const results: ReorderRecord[] = []
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined

  do {
    const res = await docClient.send(new ScanCommand({
      TableName: TABLES.ORDERS,
      FilterExpression: 'patient_msid = :msid AND org_id = :orgId AND (#src = :src1 OR #src = :src2 OR #src = :src3 OR #src = :legacySrc)',
      ExpressionAttributeNames: { '#src': 'source' },
      ExpressionAttributeValues: {
        ':msid': msid,
        ':orgId': orgId,
        ':src1': 'patient_portal',
        ':src2': 'support_request',
        ':src3': 'address_change',
        ':legacySrc': 'patient_portal_reorder',
      },
      ExclusiveStartKey,
    }))
    for (const item of res.Items ?? []) {
      results.push(normalizeReorderRecord(item))
    }
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  results.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return results
}

export async function updateReorderStatus(params: {
  id: string
  status: ReorderStatus
  orgId: string
  adminSub: string
  adminEmail: string
  // When true, also stamps approved_at/approved_by — used by the address-change
  // approval mutation. Existing callers (plain status changes) omit this.
  markApproved?: boolean
}): Promise<void> {
  const now = new Date().toISOString()
  const updateClauses = ['#status = :status', 'updated_at = :now', 'updated_by = :sub', 'updated_by_email = :email']
  const ExpressionAttributeValues: Record<string, unknown> = {
    ':status': params.status,
    ':orgId': params.orgId,
    ':now': now,
    ':sub': params.adminSub,
    ':email': params.adminEmail,
  }
  if (params.markApproved) {
    updateClauses.push('approved_at = :now', 'approved_by = :sub')
  }
  await docClient.send(new UpdateCommand({
    TableName: TABLES.ORDERS,
    Key: { pk: `ORDER#${params.id}`, sk: 'REORDER' },
    ConditionExpression: 'attribute_exists(pk) AND org_id = :orgId',
    UpdateExpression: `SET ${updateClauses.join(', ')}`,
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues,
  }))
}

export async function updateNeedsFundingReview(params: {
  id: string
  needs_funding_review: boolean
  review_reason?: string
  orgId: string
  adminSub: string
  adminEmail: string
}): Promise<void> {
  const now = new Date().toISOString()
  await docClient.send(new UpdateCommand({
    TableName: TABLES.ORDERS,
    Key: { pk: `ORDER#${params.id}`, sk: 'REORDER' },
    ConditionExpression: 'attribute_exists(pk) AND org_id = :orgId',
    UpdateExpression: 'SET needs_funding_review = :flag, updated_at = :now, updated_by = :sub, updated_by_email = :email'
      + (params.review_reason !== undefined ? ', review_reason = :reason' : ''),
    ExpressionAttributeValues: {
      ':flag':  params.needs_funding_review,
      ':orgId': params.orgId,
      ':now':   now,
      ':sub':   params.adminSub,
      ':email': params.adminEmail,
      ...(params.review_reason !== undefined && { ':reason': params.review_reason }),
    },
  }))
}

export async function getReorderById(
  id: string,
  orgId: string
): Promise<ReorderRecord | null> {
  const res = await docClient.send(new GetCommand({
    TableName: TABLES.ORDERS,
    Key: { pk: `ORDER#${id}`, sk: 'REORDER' },
  }))
  if (!res.Item) return null
  const record = normalizeReorderRecord(res.Item as Record<string, NativeAttributeValue>)
  if (record.org_id !== orgId) return null
  return record
}

const PATIENT_PORTAL_UPDATE_COPY: Record<ReorderStatus, { title: string; message: string }> = {
  new: {
    title: 'Request received',
    message: 'Your supply request has been received.',
  },
  reviewing: {
    title: 'Request under review',
    message: 'Midland Sleep staff are reviewing your request.',
  },
  approved: {
    title: 'Request approved',
    message: 'Your request has been approved. Staff are preparing your supplies.',
  },
  sent: {
    title: 'Supplies on the way',
    message: 'Your supplies have been dispatched.',
  },
  delivered: {
    title: 'Supply request complete',
    message: 'Your supply request is complete. You can submit another request when needed.',
  },
  needs_followup: {
    title: 'We will contact you',
    message: 'Midland Sleep staff will contact you if more information is needed.',
  },
  declined: {
    title: 'Please contact Midland Sleep',
    message: 'Please contact Midland Sleep about this request.',
  },
}

export type PatientPortalUpdateWriteResult =
  | { ok: true; notificationId: string }
  | { ok: false; reason: 'notifications_table_unavailable' | 'write_failed'; errorName?: string }

export async function createPatientPortalUpdate(params: {
  patientMsid: string
  requestId: string
  requestReference?: string
  status: ReorderStatus
  orgId: string
  // Optional copy overrides — used when the canned per-status copy doesn't
  // apply (e.g. address-change approval, which isn't a supply-request event).
  titleOverride?: string
  messageOverride?: string
  // Optional in-app navigation target — see PatientPortalUpdateRecord.link_target.
  linkTarget?: string
}): Promise<PatientPortalUpdateWriteResult> {
  const tableName = process.env.NOTIFICATIONS_TABLE_NAME
  if (!tableName) return { ok: false, reason: 'notifications_table_unavailable' }

  const notificationId = randomUUID()
  const createdAt = new Date().toISOString()
  const copy = PATIENT_PORTAL_UPDATE_COPY[params.status]
  const title = params.titleOverride ?? copy.title
  const message = params.messageOverride ?? copy.message

  try {
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        notification_id:   notificationId,
        org_id:            params.orgId,
        patient_msid:      params.patientMsid,
        request_id:        params.requestId,
        request_reference: params.requestReference,
        type:              'request_status_update',
        request_status:    params.status,
        title,
        message,
        channel:           'portal',
        delivery_status:   'visible',
        created_at:        createdAt,
        read_at:           null,
        link_target:       params.linkTarget,
      } satisfies PatientPortalUpdateRecord,
    }))
    return { ok: true, notificationId }
  } catch (err) {
    return {
      ok: false,
      reason: 'write_failed',
      errorName: err instanceof Error ? err.name : 'UnknownError',
    }
  }
}

export async function listPatientPortalUpdates(params: {
  patientMsid: string
  orgId: string
  limit?: number
}): Promise<PatientPortalUpdateRecord[]> {
  const tableName = process.env.NOTIFICATIONS_TABLE_NAME
  if (!tableName) return []
  const withPrefix = params.patientMsid.startsWith('MS-') ? params.patientMsid : `MS-${params.patientMsid}`
  const bareMsid = withPrefix.slice(3)

  const items: PatientPortalUpdateRecord[] = []
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined

  do {
    const res = await docClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression:
        '(patient_msid = :patientMsid OR patient_msid = :withPrefix OR patient_msid = :bareMsid)' +
        ' AND org_id = :orgId AND channel = :channel' +
        ' AND delivery_status = :deliveryStatus AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':patientMsid':     params.patientMsid,
        ':withPrefix':      withPrefix,
        ':bareMsid':        bareMsid,
        ':orgId':           params.orgId,
        ':channel':         'portal',
        ':deliveryStatus':  'visible',
        ':type':            'request_status_update',
      },
      ProjectionExpression:
        'notification_id, org_id, patient_msid, request_id, request_reference, #type,' +
        ' request_status, title, message, channel, delivery_status, created_at, read_at',
      ExclusiveStartKey,
    }))
    for (const item of res.Items ?? []) {
      items.push(item as PatientPortalUpdateRecord)
    }
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  items.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return typeof params.limit === 'number' ? items.slice(0, params.limit) : items
}

export async function markPatientPortalUpdateRead(params: {
  notificationId: string
  patientMsid: string
  orgId: string
}): Promise<PatientPortalUpdateRecord | null> {
  const tableName = process.env.NOTIFICATIONS_TABLE_NAME
  if (!tableName) return null

  const withPrefix = params.patientMsid.startsWith('MS-') ? params.patientMsid : `MS-${params.patientMsid}`
  const bareMsid = withPrefix.slice(3)
  const readAt = new Date().toISOString()

  try {
    const res = await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: { notification_id: params.notificationId },
      UpdateExpression: 'SET read_at = :readAt',
      ConditionExpression:
        'attribute_exists(notification_id)' +
        ' AND org_id = :orgId' +
        ' AND (patient_msid = :patientMsid OR patient_msid = :withPrefix OR patient_msid = :bareMsid)' +
        ' AND channel = :channel AND delivery_status = :deliveryStatus AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':readAt':         readAt,
        ':patientMsid':    params.patientMsid,
        ':withPrefix':     withPrefix,
        ':bareMsid':       bareMsid,
        ':orgId':          params.orgId,
        ':channel':        'portal',
        ':deliveryStatus': 'visible',
        ':type':           'request_status_update',
      },
      ReturnValues: 'ALL_NEW',
    }))
    return (res.Attributes as PatientPortalUpdateRecord | undefined) ?? null
  } catch (err) {
    if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
      return null
    }
    throw err
  }
}

export async function createCommsRecord(record: CommsRecord): Promise<void> {
  const timestamp = new Date().toISOString()
  await docClient.send(new PutCommand({
    TableName: TABLES.COMMS,
    Item: {
      pk: `PATIENT#${record.patient_id}`,
      sk: `COMM#${timestamp}`,
      ...record,
    },
  }))
}

// ── Patient notes (admin-only, persistent) ────────────────────────────────────

export interface PatientNoteRecord {
  pk: string               // NOTE#<msid>
  sk: string               // NOTE#<timestamp_ms>#<uuid>
  entity_type: 'patient_note'
  patient_msid: string     // normalised with MS- prefix
  org_id: string
  body: string
  created_at: string       // ISO timestamp
  created_by: string       // admin Cognito sub
  created_by_email: string
  note_type: 'internal'
  visibility: 'admin_only'
  // admin-facing note category, e.g. 'admin_note', 'contact_update' — distinct
  // from the fixed `note_type` visibility marker above
  admin_note_type?: string
  follow_up_required?: boolean
  // edit fields
  updated_at?: string
  updated_by?: string
  updated_by_email?: string
  is_edited?: boolean
  // soft-delete fields
  is_deleted?: boolean
  deleted_at?: string
  deleted_by?: string
  deleted_by_email?: string
}

export async function putPatientNote(params: {
  msid: string
  orgId: string
  body: string
  adminSub: string
  adminEmail: string
  adminNoteType?: string
  followUpRequired?: boolean
}): Promise<PatientNoteRecord> {
  const msidNorm = params.msid.startsWith('MS-') ? params.msid : `MS-${params.msid}`
  const timestamp_ms = Date.now()
  const noteId = randomUUID()
  const created_at = new Date().toISOString()
  const record: PatientNoteRecord = {
    pk: `NOTE#${msidNorm}`,
    sk: `NOTE#${timestamp_ms}#${noteId}`,
    entity_type: 'patient_note',
    patient_msid: msidNorm,
    org_id: params.orgId,
    body: params.body,
    created_at,
    created_by: params.adminSub,
    created_by_email: params.adminEmail,
    note_type: 'internal',
    visibility: 'admin_only',
    ...(params.adminNoteType !== undefined && { admin_note_type: params.adminNoteType }),
    ...(params.followUpRequired !== undefined && { follow_up_required: params.followUpRequired }),
  }
  await docClient.send(new PutCommand({
    TableName: TABLES.PATIENTS,
    Item: record,
  }))
  return record
}

export async function listPatientNotes(
  msid: string,
  orgId: string,
  limit = 50
): Promise<PatientNoteRecord[]> {
  const msidNorm = msid.startsWith('MS-') ? msid : `MS-${msid}`
  const res = await docClient.send(new QueryCommand({
    TableName: TABLES.PATIENTS,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
    FilterExpression: 'org_id = :orgId AND (attribute_not_exists(is_deleted) OR is_deleted = :notDeleted)',
    ExpressionAttributeValues: {
      ':pk': `NOTE#${msidNorm}`,
      ':skPrefix': 'NOTE#',
      ':orgId': orgId,
      ':notDeleted': false,
    },
    ScanIndexForward: false,
    Limit: limit,
  }))
  return (res.Items ?? []) as PatientNoteRecord[]
}

export async function getPatientNote(
  msid: string,
  noteSk: string,
  orgId: string
): Promise<PatientNoteRecord | null> {
  const msidNorm = msid.startsWith('MS-') ? msid : `MS-${msid}`
  const res = await docClient.send(new GetCommand({
    TableName: TABLES.PATIENTS,
    Key: { pk: `NOTE#${msidNorm}`, sk: noteSk },
  }))
  const item = res.Item as PatientNoteRecord | undefined
  if (!item || item.org_id !== orgId) return null
  return item
}

export async function updatePatientNote(params: {
  msid: string
  noteSk: string
  body: string
  adminSub: string
  adminEmail: string
  orgId: string
}): Promise<void> {
  const msidNorm = params.msid.startsWith('MS-') ? params.msid : `MS-${params.msid}`
  const updated_at = new Date().toISOString()
  await docClient.send(new UpdateCommand({
    TableName: TABLES.PATIENTS,
    Key: { pk: `NOTE#${msidNorm}`, sk: params.noteSk },
    ConditionExpression: 'org_id = :orgId AND attribute_not_exists(is_deleted)',
    UpdateExpression: 'SET #body = :body, updated_at = :updated_at, updated_by = :updated_by, updated_by_email = :updated_by_email, is_edited = :is_edited',
    ExpressionAttributeNames: { '#body': 'body' },
    ExpressionAttributeValues: {
      ':body': params.body,
      ':updated_at': updated_at,
      ':updated_by': params.adminSub,
      ':updated_by_email': params.adminEmail,
      ':is_edited': true,
      ':orgId': params.orgId,
    },
  }))
}

export async function softDeletePatientNote(params: {
  notePk: string   // exact pk from the retrieved note record — no reconstruction
  noteSk: string   // exact sk from the retrieved note record — no reconstruction
  adminSub: string
  adminEmail: string
}): Promise<void> {
  const deleted_at = new Date().toISOString()
  await docClient.send(new UpdateCommand({
    TableName: TABLES.PATIENTS,
    Key: { pk: params.notePk, sk: params.noteSk },
    ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)',
    UpdateExpression: 'SET is_deleted = :is_deleted, deleted_at = :deleted_at, deleted_by = :deleted_by, deleted_by_email = :deleted_by_email',
    ExpressionAttributeValues: {
      ':is_deleted': true,
      ':deleted_at': deleted_at,
      ':deleted_by': params.adminSub,
      ':deleted_by_email': params.adminEmail,
    },
  }))
}
