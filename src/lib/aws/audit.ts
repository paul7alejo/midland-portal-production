import 'server-only'
import { appendAuditLog } from '@/lib/aws/dynamodb'

const ORG_ID = 'midland-sleep'

export type AdminAuditAction =
  | 'ADMIN_PASSWORD_RESET_ATTEMPT'
  | 'ADMIN_ACCOUNT_UNLOCK_ATTEMPT'
  | 'NOTE_CREATED'
  | 'NOTE_UPDATED'
  | 'NOTE_DELETE_ATTEMPT'
  | 'PATIENT_REVIEW_STATUS_UPDATED'
  | 'PATIENT_OUTREACH_STATUS_UPDATED'
  | 'PATIENT_SAFETY_STATUS_UPDATED'
  | 'PATIENT_SAFETY_DETAILS_UPDATED'
  | 'PORTAL_ACCOUNT_ARCHIVED'
  | 'PORTAL_ACCOUNT_RESTORED'
  | 'LINKED_PATIENT_ARCHIVED'
  | 'LINKED_PATIENT_RESTORED'

export interface AdminAuditParams {
  action: AdminAuditAction
  adminSub: string
  adminEmail: string
  patientMsid: string
  patientNhiMasked?: string   // omit when not available on the server path
  noteId?: string             // note sk; omit full body — safe ID only
  details?: string            // safe plain-English summary; no NHI, no secrets
}

export type AuditWriteResult =
  | { ok: true }
  | { ok: false; errorName: string }

// PutItem only — enforced by appendAuditLog.
// Returns { ok: false } on failure; caller MUST check and abort before any Cognito action.
export async function writeAdminAuditEvent(
  params: AdminAuditParams
): Promise<AuditWriteResult> {
  try {
    await appendAuditLog({
      userId:             params.adminSub,
      // event_type is the existing appendAuditLog field; action is the scannable top-level attribute
      event_type:         params.action,
      action:             params.action,
      admin_id:           params.adminSub,
      admin_email:        params.adminEmail,
      patient_msid:       params.patientMsid,
      ...(params.patientNhiMasked !== undefined && {
        patient_nhi_masked: params.patientNhiMasked,
      }),
      ...(params.noteId !== undefined && { note_id: params.noteId }),
      ...(params.details !== undefined && { details: params.details }),
      org_id:             ORG_ID,
      timestamp:          new Date().toISOString(),
      result:             'attempted',
    })
    return { ok: true }
  } catch (err: unknown) {
    const errorName  = err instanceof Error ? err.name : 'UnknownError'
    const requestId  = (err as { $metadata?: { requestId?: string } }).$metadata?.requestId
    const httpStatus = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    // Log only safe metadata — no user data, no secrets
    console.error('[audit] writeAdminAuditEvent failed', {
      action: params.action,
      errorName,
      requestId,
      httpStatus,
    })
    return { ok: false, errorName }
  }
}
