import 'server-only'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { NativeAttributeValue } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000

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

export type NotificationTriggerStatus = 'approved' | 'sent' | 'declined' | 'needs_followup'
export type NotificationQueueStep     = 'env_check' | 'supersede_existing' | 'put_notification'

export type QueueNotificationResult =
  | { ok: true; scheduledFor: string; notificationId: string; supersededCount: number }
  | {
      ok: false
      reason: 'queue_unavailable'
      step: NotificationQueueStep
      hasNotificationsTableName: boolean
      errorName?: string
      awsHttpStatus?: number
      awsRequestId?: string
    }

export interface NotificationSummary {
  delivery_status:  string
  trigger_status:   string
  delivery_channel: string
  scheduled_for:    string
  created_at:       string
  supersededCount:  number
}

// Bounded table scan — acceptable for Phase 2E-2A (small table).
// Production scale: add a request_id-index GSI (or request_id + delivery_status composite index)
// to avoid full-table scans per status change.
async function supersedePendingNotifications(
  newNotificationId: string,
  requestId: string,
  tableName: string,
  now: string
): Promise<number> {
  const toSupersede: string[] = []
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined

  do {
    const res = await docClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: 'request_id = :rid AND delivery_status = :queued',
      ExpressionAttributeValues: { ':rid': requestId, ':queued': 'queued' },
      ProjectionExpression: 'notification_id',
      ...(ExclusiveStartKey && { ExclusiveStartKey }),
    }))
    for (const item of res.Items ?? []) {
      const nid = (item as { notification_id?: string }).notification_id
      if (nid) toSupersede.push(nid)
    }
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  if (toSupersede.length === 0) return 0

  const updateResults = await Promise.allSettled(
    toSupersede.map((nid) =>
      docClient.send(new UpdateCommand({
        TableName: tableName,
        Key: { notification_id: nid },
        UpdateExpression:
          'SET delivery_status = :superseded, superseded_at = :now,' +
          ' superseded_by_notification_id = :newId, superseded_reason = :reason',
        ConditionExpression: 'delivery_status = :queued',
        ExpressionAttributeValues: {
          ':superseded': 'superseded',
          ':now':        now,
          ':newId':      newNotificationId,
          ':reason':     'request_status_changed_before_send',
          ':queued':     'queued',
        },
      }))
    )
  )

  let successCount = 0
  for (const result of updateResults) {
    if (result.status === 'fulfilled') {
      successCount++
    } else {
      throw result.reason
    }
  }

  return successCount
}

export async function queuePatientNotification(params: {
  patientMsid:   string
  requestId:     string
  triggerStatus: NotificationTriggerStatus
  orgId:         string
}): Promise<QueueNotificationResult> {
  const tableName = process.env.NOTIFICATIONS_TABLE_NAME
  const hasNotificationsTableName = Boolean(tableName)
  if (!tableName) {
    console.error('[notifications] queuePatientNotification failed', {
      action:                    'queue_patient_notification',
      step:                      'env_check',
      trigger_status:            params.triggerStatus,
      hasNotificationsTableName,
      errorName:                 'MissingNotificationsTableName',
    })
    return {
      ok: false,
      reason: 'queue_unavailable',
      step: 'env_check',
      hasNotificationsTableName,
      errorName: 'MissingNotificationsTableName',
    }
  }

  const now            = new Date()
  const nowIso         = now.toISOString()
  const scheduledFor   = new Date(now.getTime() + FIFTEEN_MINUTES_MS).toISOString()
  const newNotificationId = randomUUID()

  // Supersede older queued notifications before creating the new one — fail closed.
  // If supersede fails, do not create the new notification.
  let supersededCount = 0
  try {
    supersededCount = await supersedePendingNotifications(newNotificationId, params.requestId, tableName, nowIso)
  } catch (err: unknown) {
    const errorName  = err instanceof Error ? err.name : 'UnknownError'
    const requestId  = (err as { $metadata?: { requestId?: string } }).$metadata?.requestId
    const httpStatus = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    console.error('[notifications] queuePatientNotification failed', {
      action:                    'queue_patient_notification',
      step:                      'supersede_existing',
      trigger_status:            params.triggerStatus,
      hasNotificationsTableName,
      errorName,
      awsHttpStatus:             httpStatus,
      awsRequestId:              requestId,
    })
    return {
      ok: false,
      reason: 'queue_unavailable',
      step: 'supersede_existing',
      hasNotificationsTableName,
      errorName,
      awsHttpStatus: httpStatus,
      awsRequestId:  requestId,
    }
  }

  try {
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        notification_id:  newNotificationId,
        org_id:           params.orgId,
        patient_msid:     params.patientMsid,
        request_id:       params.requestId,
        event_type:       'request_status_update',
        trigger_status:   params.triggerStatus,
        delivery_channel: 'email',
        delivery_status:  'queued',
        scheduled_for:    scheduledFor,
        created_at:       nowIso,
        source:           'admin_order_status_change',
      },
    }))
    return { ok: true, scheduledFor, notificationId: newNotificationId, supersededCount }
  } catch (err: unknown) {
    const errorName  = err instanceof Error ? err.name : 'UnknownError'
    const requestId  = (err as { $metadata?: { requestId?: string } }).$metadata?.requestId
    const httpStatus = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    console.error('[notifications] queuePatientNotification failed', {
      action:                    'queue_patient_notification',
      step:                      'put_notification',
      trigger_status:            params.triggerStatus,
      hasNotificationsTableName,
      errorName,
      awsHttpStatus:             httpStatus,
      awsRequestId:              requestId,
    })
    return {
      ok: false,
      reason: 'queue_unavailable',
      step: 'put_notification',
      hasNotificationsTableName,
      errorName,
      awsHttpStatus: httpStatus,
      awsRequestId:  requestId,
    }
  }
}

// Returns the latest queued notification summary for a given request_id, or null if none.
// Bounded table scan — see note above about GSI for production scale.
export async function getLatestNotificationForRequest(
  requestId: string
): Promise<NotificationSummary | null> {
  const tableName = process.env.NOTIFICATIONS_TABLE_NAME
  if (!tableName) return null

  const allItems: Array<Record<string, unknown>> = []
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined

  do {
    const res = await docClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: 'request_id = :rid',
      ExpressionAttributeValues: { ':rid': requestId },
      ProjectionExpression: 'delivery_status, trigger_status, delivery_channel, scheduled_for, created_at',
      ...(ExclusiveStartKey && { ExclusiveStartKey }),
    }))
    for (const item of res.Items ?? []) {
      allItems.push(item as Record<string, unknown>)
    }
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  const timestampValue = (item: Record<string, unknown>, key: 'created_at' | 'scheduled_for') => {
    const value = item[key]
    if (typeof value !== 'string') return 0
    const timestamp = Date.parse(value)
    return Number.isFinite(timestamp) ? timestamp : 0
  }

  const newestFirst = (a: Record<string, unknown>, b: Record<string, unknown>) => {
    const createdDiff = timestampValue(b, 'created_at') - timestampValue(a, 'created_at')
    if (createdDiff !== 0) return createdDiff
    return timestampValue(b, 'scheduled_for') - timestampValue(a, 'scheduled_for')
  }

  const queued = allItems
    .filter((n) => n.delivery_status === 'queued')
    .sort(newestFirst)[0]
  if (!queued) return null

  const supersededCount = allItems.filter((n) => n.delivery_status === 'superseded').length

  return {
    delivery_status:  'queued',
    trigger_status:   typeof queued.trigger_status   === 'string' ? queued.trigger_status   : '',
    delivery_channel: typeof queued.delivery_channel === 'string' ? queued.delivery_channel : 'email',
    scheduled_for:    typeof queued.scheduled_for    === 'string' ? queued.scheduled_for    : '',
    created_at:       typeof queued.created_at       === 'string' ? queued.created_at       : '',
    supersededCount,
  }
}
