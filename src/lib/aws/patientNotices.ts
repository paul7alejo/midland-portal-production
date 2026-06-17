import 'server-only'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.DYNAMODB_REGION ?? process.env.AWS_REGION ?? 'ap-southeast-2',
    ...(process.env.MIDLAND_ACCESS_KEY_ID && {
      credentials: {
        accessKeyId:     process.env.MIDLAND_ACCESS_KEY_ID,
        secretAccessKey: process.env.MIDLAND_SECRET_ACCESS_KEY!,
      },
    }),
  }),
  { marshallOptions: { removeUndefinedValues: true } }
)

const ORG_ID = 'midland-sleep'

export type NoticeAudienceType = 'all_patients' | 'single_patient'
export type NoticePlacement    = 'top_strip' | 'notification_bell' | 'dashboard_card'
export type NoticePriority     = 'info' | 'reminder' | 'important'
export type NoticeStatus       = 'draft' | 'published' | 'expired' | 'archived'

export interface PatientNoticeRecord {
  PK:                string          // ORG#midland-sleep
  SK:                string          // NOTICE#<notice_id>
  notice_id:         string
  org_id:            string
  title:             string
  message:           string
  audience_type:     NoticeAudienceType
  patient_msid?:     string
  placement:         NoticePlacement
  priority:          NoticePriority
  status:            NoticeStatus
  starts_at?:        string
  expires_at?:       string
  created_by:        string
  created_by_email:  string
  created_at:        string
  updated_by:        string
  updated_by_email:  string
  updated_at:        string
  published_by?:     string
  published_by_email?: string
  published_at?:     string
  expired_by?:       string
  expired_by_email?: string
  expired_at?:       string
  archived_by?:      string
  archived_by_email?: string
  archived_at?:      string
}

export type AdminPatientNotice = Omit<
  PatientNoticeRecord,
  | 'PK'
  | 'SK'
  | 'created_by'
  | 'updated_by'
  | 'published_by'
  | 'expired_by'
  | 'archived_by'
  | 'created_by_email'
  | 'updated_by_email'
  | 'published_by_email'
  | 'expired_by_email'
  | 'archived_by_email'
> & {
  created_by_label: string
  updated_by_label: string
  published_by_label?: string
  expired_by_label?: string
  archived_by_label?: string
}

export function sanitizePatientNotice(record: PatientNoticeRecord): AdminPatientNotice {
  return {
    notice_id: record.notice_id,
    org_id: record.org_id,
    title: record.title,
    message: record.message,
    audience_type: record.audience_type,
    ...(record.patient_msid !== undefined && { patient_msid: record.patient_msid }),
    placement: record.placement,
    priority: record.priority,
    status: record.status,
    ...(record.starts_at !== undefined && { starts_at: record.starts_at }),
    ...(record.expires_at !== undefined && { expires_at: record.expires_at }),
    created_at: record.created_at,
    updated_at: record.updated_at,
    ...(record.published_at !== undefined && { published_at: record.published_at }),
    ...(record.expired_at !== undefined && { expired_at: record.expired_at }),
    ...(record.archived_at !== undefined && { archived_at: record.archived_at }),
    created_by_label: 'Admin',
    updated_by_label: 'Admin',
    ...(record.published_at !== undefined && { published_by_label: 'Admin' }),
    ...(record.expired_at !== undefined && { expired_by_label: 'Admin' }),
    ...(record.archived_at !== undefined && { archived_by_label: 'Admin' }),
  }
}

// ── Patient-facing type and helpers ──────────────────────────────────────────

export interface PatientFacingNotice {
  noticeId:    string
  title:       string
  message:     string
  placement:   NoticePlacement
  priority:    NoticePriority
  publishedAt: string
  expiresAt?:  string
}

export function sanitizeNoticeForPatient(record: PatientNoticeRecord): PatientFacingNotice {
  return {
    noticeId:    record.notice_id,
    title:       record.title,
    message:     record.message,
    placement:   record.placement,
    priority:    record.priority,
    publishedAt: record.published_at ?? record.updated_at,
    ...(record.expires_at !== undefined && { expiresAt: record.expires_at }),
  }
}

const PRIORITY_ORDER: Record<NoticePriority, number> = {
  important: 3,
  reminder:  2,
  info:      1,
}

export async function listPublishedNoticesForPatient(
  patientMsid: string
): Promise<PatientFacingNotice[]> {
  const all = await listPatientNotices()
  const now = Date.now()

  return all
    .filter((n) => {
      if (n.status !== 'published') return false
      if (n.audience_type === 'single_patient' && n.patient_msid !== patientMsid) return false
      if (n.starts_at  && new Date(n.starts_at).getTime()  > now) return false
      if (n.expires_at && new Date(n.expires_at).getTime() <= now) return false
      return true
    })
    .sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return (b.published_at ?? b.updated_at).localeCompare(a.published_at ?? a.updated_at)
    })
    .map(sanitizeNoticeForPatient)
}

// Midland-only fallback: Amplify sometimes fails to propagate env vars into the
// server runtime even when the variable is set in the Amplify console. The
// hardcoded name is safe here because this module is Midland-specific and the
// table name is not a secret.
function tableName(): string {
  const configured = process.env.PATIENT_NOTICES_TABLE_NAME?.trim()
  return configured || 'midland-sleep-patient-notices'
}

function orgPk(): string {
  return `ORG#${ORG_ID}`
}

function noticeSk(noticeId: string): string {
  return `NOTICE#${noticeId}`
}

export async function createPatientNotice(params: {
  title:         string
  message:       string
  audience_type: NoticeAudienceType
  patient_msid?: string
  placement:     NoticePlacement
  priority:      NoticePriority
  starts_at?:    string
  expires_at?:   string
  adminSub:      string
  adminEmail:    string
}): Promise<PatientNoticeRecord> {
  const notice_id = randomUUID()
  const now       = new Date().toISOString()

  const item: PatientNoticeRecord = {
    PK:               orgPk(),
    SK:               noticeSk(notice_id),
    notice_id,
    org_id:           ORG_ID,
    title:            params.title,
    message:          params.message,
    audience_type:    params.audience_type,
    placement:        params.placement,
    priority:         params.priority,
    status:           'draft',
    created_by:       params.adminSub,
    created_by_email: params.adminEmail,
    created_at:       now,
    updated_by:       params.adminSub,
    updated_by_email: params.adminEmail,
    updated_at:       now,
    ...(params.patient_msid !== undefined && { patient_msid: params.patient_msid }),
    ...(params.starts_at    !== undefined && { starts_at:   params.starts_at }),
    ...(params.expires_at   !== undefined && { expires_at:  params.expires_at }),
  }

  await docClient.send(new PutCommand({
    TableName:           tableName(),
    Item:                item,
    ConditionExpression: 'attribute_not_exists(PK)',
  }))

  return item
}

export async function getPatientNotice(noticeId: string): Promise<PatientNoticeRecord | null> {
  const res = await docClient.send(new GetCommand({
    TableName: tableName(),
    Key:       { PK: orgPk(), SK: noticeSk(noticeId) },
  }))
  return (res.Item as PatientNoticeRecord) ?? null
}

export async function listPatientNotices(): Promise<PatientNoticeRecord[]> {
  const res = await docClient.send(new QueryCommand({
    TableName:                 tableName(),
    KeyConditionExpression:    'PK = :pk',
    ExpressionAttributeValues: { ':pk': orgPk() },
    ScanIndexForward:          false,
  }))
  const items = (res.Items ?? []) as PatientNoticeRecord[]
  // Sort by updated_at descending (UUIDs in SK aren't time-ordered)
  return items.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

export async function updatePatientNotice(params: {
  noticeId:      string
  title:         string
  message:       string
  audience_type: NoticeAudienceType
  patient_msid?: string
  placement:     NoticePlacement
  priority:      NoticePriority
  starts_at?:    string
  expires_at?:   string
  adminSub:      string
  adminEmail:    string
}): Promise<PatientNoticeRecord> {
  const now = new Date().toISOString()

  const setExprs: string[] = [
    '#title = :title',
    '#message = :message',
    'audience_type = :audience_type',
    'placement = :placement',
    'priority = :priority',
    'updated_by = :updated_by',
    'updated_by_email = :updated_by_email',
    'updated_at = :updated_at',
  ]
  const removeExprs: string[] = []

  const ean: Record<string, string> = {
    '#title':   'title',
    '#message': 'message',
    '#status':  'status',
  }

  const eav: Record<string, unknown> = {
    ':title':            params.title,
    ':message':          params.message,
    ':audience_type':    params.audience_type,
    ':placement':        params.placement,
    ':priority':         params.priority,
    ':updated_by':       params.adminSub,
    ':updated_by_email': params.adminEmail,
    ':updated_at':       now,
    ':draft':            'draft',
  }

  if (params.patient_msid !== undefined) {
    setExprs.push('patient_msid = :patient_msid')
    eav[':patient_msid'] = params.patient_msid
  } else {
    removeExprs.push('#patient_msid')
    ean['#patient_msid'] = 'patient_msid'
  }
  if (params.starts_at !== undefined) {
    setExprs.push('starts_at = :starts_at')
    eav[':starts_at'] = params.starts_at
  } else {
    removeExprs.push('#starts_at')
    ean['#starts_at'] = 'starts_at'
  }
  if (params.expires_at !== undefined) {
    setExprs.push('expires_at = :expires_at')
    eav[':expires_at'] = params.expires_at
  } else {
    removeExprs.push('#expires_at')
    ean['#expires_at'] = 'expires_at'
  }

  const updateExpression = [
    `SET ${setExprs.join(', ')}`,
    removeExprs.length > 0 ? `REMOVE ${removeExprs.join(', ')}` : '',
  ].filter(Boolean).join(' ')

  const res = await docClient.send(new UpdateCommand({
    TableName:                 tableName(),
    Key:                       { PK: orgPk(), SK: noticeSk(params.noticeId) },
    UpdateExpression:          updateExpression,
    ConditionExpression:       'attribute_exists(PK) AND #status = :draft',
    ExpressionAttributeNames:  ean,
    ExpressionAttributeValues: eav,
    ReturnValues:              'ALL_NEW',
  }))

  return res.Attributes as PatientNoticeRecord
}

export async function publishPatientNotice(params: {
  noticeId:   string
  adminSub:   string
  adminEmail: string
}): Promise<PatientNoticeRecord> {
  const now = new Date().toISOString()

  const res = await docClient.send(new UpdateCommand({
    TableName:        tableName(),
    Key:              { PK: orgPk(), SK: noticeSk(params.noticeId) },
    UpdateExpression: 'SET #status = :published, published_by = :by, published_by_email = :email, published_at = :at, updated_by = :by, updated_by_email = :email, updated_at = :at',
    ConditionExpression: 'attribute_exists(PK) AND #status = :draft',
    ExpressionAttributeNames:  { '#status': 'status' },
    ExpressionAttributeValues: {
      ':published': 'published',
      ':draft':     'draft',
      ':by':        params.adminSub,
      ':email':     params.adminEmail,
      ':at':        now,
    },
    ReturnValues: 'ALL_NEW',
  }))

  return res.Attributes as PatientNoticeRecord
}

export async function expirePatientNotice(params: {
  noticeId:   string
  adminSub:   string
  adminEmail: string
}): Promise<PatientNoticeRecord> {
  const now = new Date().toISOString()

  const res = await docClient.send(new UpdateCommand({
    TableName:        tableName(),
    Key:              { PK: orgPk(), SK: noticeSk(params.noticeId) },
    UpdateExpression: 'SET #status = :expired, expired_by = :by, expired_by_email = :email, expired_at = :at, updated_by = :by, updated_by_email = :email, updated_at = :at',
    ConditionExpression: 'attribute_exists(PK) AND #status = :published',
    ExpressionAttributeNames:  { '#status': 'status' },
    ExpressionAttributeValues: {
      ':expired':   'expired',
      ':published': 'published',
      ':by':        params.adminSub,
      ':email':     params.adminEmail,
      ':at':        now,
    },
    ReturnValues: 'ALL_NEW',
  }))

  return res.Attributes as PatientNoticeRecord
}

export async function archivePatientNotice(params: {
  noticeId:   string
  adminSub:   string
  adminEmail: string
}): Promise<PatientNoticeRecord> {
  const now = new Date().toISOString()

  const res = await docClient.send(new UpdateCommand({
    TableName:        tableName(),
    Key:              { PK: orgPk(), SK: noticeSk(params.noticeId) },
    UpdateExpression: 'SET #status = :archived, archived_by = :by, archived_by_email = :email, archived_at = :at, updated_by = :by, updated_by_email = :email, updated_at = :at',
    ConditionExpression: 'attribute_exists(PK) AND #status IN (:draft, :published)',
    ExpressionAttributeNames:  { '#status': 'status' },
    ExpressionAttributeValues: {
      ':archived':  'archived',
      ':draft':     'draft',
      ':published': 'published',
      ':by':        params.adminSub,
      ':email':     params.adminEmail,
      ':at':        now,
    },
    ReturnValues: 'ALL_NEW',
  }))

  return res.Attributes as PatientNoticeRecord
}
