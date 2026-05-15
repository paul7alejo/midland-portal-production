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
  })
)

// ── Record types ──────────────────────────────────────────────────────────────

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
  funded_by?: string
  nhi_encrypted?: string
  nhi_hash?: string
  import_batch_id?: string
  import_row_number?: number
  import_source?: 'admin_csv'
  import_status?: 'imported'
  review_status?: 'pending_review'
  created_at?: string
  created_by?: string
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

export type ImportedPatientSummary = Pick<
  PatientRecord,
  | 'patient_id'
  | 'portal_id'
  | 'org_id'
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'date_of_birth'
  | 'funded_by'
  | 'import_batch_id'
  | 'import_row_number'
  | 'import_status'
  | 'review_status'
  | 'created_at'
  | 'created_by'
>

// ── Query functions ───────────────────────────────────────────────────────────

export async function getPatientByMSID(msid: string, orgId: string): Promise<PatientRecord | null> {
  const res = await docClient.send(new QueryCommand({
    TableName: TABLES.PATIENTS,
    IndexName: 'portal_id-index',
    KeyConditionExpression: 'portal_id = :msid',
    FilterExpression: 'org_id = :orgId',
    ExpressionAttributeValues: { ':msid': msid, ':orgId': orgId },
    Limit: 1,
  }))
  return (res.Items?.[0] as PatientRecord) ?? null
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
        '#dateOfBirth',
        '#fundedBy',
        '#importBatchId',
        '#importRowNumber',
        '#importStatus',
        '#reviewStatus',
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
        '#dateOfBirth': 'date_of_birth',
        '#fundedBy': 'funded_by',
        '#importBatchId': 'import_batch_id',
        '#importRowNumber': 'import_row_number',
        '#importStatus': 'import_status',
        '#reviewStatus': 'review_status',
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
  fields: { name?: string; email?: string }
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

// ── Reorder requests (Phase 1F) ───────────────────────────────────────────────

export interface ReorderDeliveryAddress {
  line1: string
  line2?: string
  city: string
  region?: string
  postcode: string
  country: string
}

export interface ReorderRequest {
  patient_id: string
  patient_msid: string
  patient_name: string
  org_id: string
  items: string[]
  delivery_address: ReorderDeliveryAddress
  created_by: string  // Cognito sub of submitting patient
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
  delivery_address: ReorderDeliveryAddress
  status: 'pending_review'
  source: 'patient_portal_reorder'
  created_by: string
  created_at: string
}

function createRequestReference(createdAt: string): string {
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

export async function createReorderRequest(req: ReorderRequest): Promise<ReorderRecord> {
  const id = randomUUID()
  const created_at = new Date().toISOString()
  const item: ReorderRecord = {
    pk: `ORDER#${id}`,
    sk: 'REORDER',
    id,
    request_reference: createRequestReference(created_at),
    patient_id: req.patient_id,
    patient_msid: req.patient_msid,
    patient_name: req.patient_name,
    org_id: req.org_id,
    items: req.items,
    delivery_address: req.delivery_address,
    status: 'pending_review',
    source: 'patient_portal_reorder',
    created_by: req.created_by,
    created_at,
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
      FilterExpression: 'org_id = :orgId AND #src = :source',
      ExpressionAttributeNames: { '#src': 'source' },
      ExpressionAttributeValues: {
        ':orgId': orgId,
        ':source': 'patient_portal_reorder',
      },
      ExclusiveStartKey,
    }))
    for (const item of res.Items ?? []) {
      results.push(item as ReorderRecord)
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
        '#src = :source',
        '#status = :status',
      ].join(' AND '),
      ExpressionAttributeNames: {
        '#src': 'source',
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':patientId': patientId,
        ':orgId': orgId,
        ':source': 'patient_portal_reorder',
        ':status': 'pending_review',
      },
      ExclusiveStartKey,
    }))
    for (const item of res.Items ?? []) {
      results.push(item as ReorderRecord)
    }
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  results.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return results[0] ?? null
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
