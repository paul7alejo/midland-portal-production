import 'server-only'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
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
  nhi_encrypted?: string
  nhi_hash?: string
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
}

export interface MaskRecord {
  pk: string         // MASK#id
  sk: string         // PATIENT#patientId
  org_id: string
  mask_id: string
  patient_id: string
  name: string
  brand: string
  type: 'full_face' | 'nasal' | 'nasal_pillows'
  size: string
  fitted_date: string
  image_url?: string
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
