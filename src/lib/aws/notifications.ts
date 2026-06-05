import 'server-only'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
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

export type QueueNotificationResult =
  | { ok: true;  scheduledFor: string }
  | { ok: false; reason: 'queue_unavailable'; errorName?: string }

export async function queuePatientNotification(params: {
  patientMsid:   string
  requestId:     string
  triggerStatus: NotificationTriggerStatus
  orgId:         string
}): Promise<QueueNotificationResult> {
  const tableName = process.env.NOTIFICATIONS_TABLE_NAME
  if (!tableName) {
    console.error('[notifications] NOTIFICATIONS_TABLE_NAME env var not set — queue unavailable')
    return { ok: false, reason: 'queue_unavailable' }
  }

  const now          = new Date()
  const scheduledFor = new Date(now.getTime() + FIFTEEN_MINUTES_MS).toISOString()

  try {
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        notification_id:  randomUUID(),
        org_id:           params.orgId,
        patient_msid:     params.patientMsid,
        request_id:       params.requestId,
        event_type:       'request_status_update',
        trigger_status:   params.triggerStatus,
        delivery_channel: 'email',
        delivery_status:  'queued',
        scheduled_for:    scheduledFor,
        created_at: now.toISOString(),
        source:     'admin_order_status_change',
      },
    }))
    return { ok: true, scheduledFor }
  } catch (err: unknown) {
    const errorName  = err instanceof Error ? err.name : 'UnknownError'
    const requestId  = (err as { $metadata?: { requestId?: string } }).$metadata?.requestId
    const httpStatus = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    console.error('[notifications] queuePatientNotification failed', {
      errorName,
      requestId,
      httpStatus,
      triggerStatus: params.triggerStatus,
    })
    return { ok: false, reason: 'queue_unavailable', errorName }
  }
}
