import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser, safeLog, HttpError } from '@/lib/security';
import {
  getPatientByMSID,
  listPatientPortalUpdates,
  markPatientPortalUpdateRead,
  type PatientPortalUpdateRecord,
} from '@/lib/aws/dynamodb';

type SafePatientNotification = Pick<
  PatientPortalUpdateRecord,
  | 'notification_id'
  | 'request_id'
  | 'request_reference'
  | 'title'
  | 'message'
  | 'created_at'
  | 'read_at'
  | 'channel'
  | 'delivery_status'
  | 'link_target'
>;

function toSafeNotification(update: PatientPortalUpdateRecord): SafePatientNotification {
  return {
    notification_id: update.notification_id,
    request_id: update.request_id,
    request_reference: update.request_reference,
    title: update.title,
    message: update.message,
    created_at: update.created_at,
    read_at: update.read_at ?? null,
    channel: update.channel,
    delivery_status: update.delivery_status,
    link_target: update.link_target,
  };
}

async function getPatientContext(request: NextRequest) {
  const user = await getVerifiedUser(request);
  const patient = await getPatientByMSID(user.msid, user.orgId);
  if (!patient) throw new HttpError(404, 'Patient not found');

  return {
    orgId: user.orgId,
    patientMsid: patient.portal_id ?? user.msid,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { orgId, patientMsid } = await getPatientContext(request);
    safeLog('patient/notifications: fetching notifications', { orgId });

    const notifications = await listPatientPortalUpdates({ patientMsid, orgId });
    const safeNotifications = notifications.map(toSafeNotification);
    const unreadCount = safeNotifications.filter((notification) => !notification.read_at).length;

    return NextResponse.json({ notifications: safeNotifications, unreadCount });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('patient/notifications GET ERROR:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { orgId, patientMsid } = await getPatientContext(request);
    const body = await request.json().catch(() => ({})) as { notification_id?: unknown };
    const notificationId = typeof body.notification_id === 'string' ? body.notification_id.trim() : '';
    if (!notificationId) {
      return NextResponse.json({ error: 'notification_id is required' }, { status: 400 });
    }

    const updated = await markPatientPortalUpdateRead({ notificationId, patientMsid, orgId });
    if (!updated) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ notification: toSafeNotification(updated) });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('patient/notifications PATCH ERROR:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
