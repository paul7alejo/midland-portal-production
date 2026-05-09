import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security';
import {
  getPatientByMSID,
  getPatientDevices,
  getPatientMask,
  listImportedPatients,
  type DeviceRecord,
  type ImportedPatientSummary,
  type MaskRecord,
  type PatientRecord,
} from '@/lib/aws/dynamodb';

const ORG_ID = 'midland-sleep';

function sanitizeImportedPatient(patient: PatientRecord): ImportedPatientSummary {
  return {
    patient_id: patient.patient_id,
    portal_id: patient.portal_id,
    org_id: patient.org_id,
    name: patient.name,
    email: patient.email,
    phone: patient.phone,
    address: patient.address,
    date_of_birth: patient.date_of_birth,
    funded_by: patient.funded_by,
    import_batch_id: patient.import_batch_id,
    import_row_number: patient.import_row_number,
    import_status: patient.import_status,
    review_status: patient.review_status,
    created_at: patient.created_at,
    created_by: patient.created_by,
  };
}

function sanitizeDevice(device: DeviceRecord) {
  return {
    device_id: device.device_id,
    patient_id: device.patient_id,
    org_id: device.org_id,
    name: device.name,
    brand: device.brand,
    model: device.model,
    serial_number: device.serial_number,
    setup_date: device.setup_date,
    funded_by: device.funded_by,
    import_batch_id: device.import_batch_id,
    import_row_number: device.import_row_number,
    import_status: device.import_status,
    review_status: device.review_status,
    created_at: device.created_at,
    created_by: device.created_by,
  };
}

function sanitizeMask(mask: MaskRecord) {
  return {
    mask_id: mask.mask_id,
    patient_id: mask.patient_id,
    org_id: mask.org_id,
    name: mask.name,
    brand: mask.brand,
    model: mask.model,
    type: mask.type,
    size: mask.size,
    fitted_date: mask.fitted_date,
    import_batch_id: mask.import_batch_id,
    import_row_number: mask.import_row_number,
    import_status: mask.import_status,
    review_status: mask.review_status,
    created_at: mask.created_at,
    created_by: mask.created_by,
  };
}

export async function GET(request: NextRequest) {
  const user = await getAdminUser();
  if (!user || !isAuthorizedAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const msid = request.nextUrl.searchParams.get('msid')?.trim();

  try {
    if (msid) {
      const patient = await getPatientByMSID(msid, ORG_ID);
      if (!patient || patient.import_source !== 'admin_csv') {
        return NextResponse.json({ error: 'Imported patient not found' }, { status: 404 });
      }

      const [devices, mask] = await Promise.all([
        getPatientDevices(patient.patient_id, ORG_ID),
        getPatientMask(patient.patient_id, ORG_ID),
      ]);

      return NextResponse.json({
        patient: sanitizeImportedPatient(patient),
        devices: devices.map(sanitizeDevice),
        mask: mask ? sanitizeMask(mask) : null,
      });
    }

    const patients = await listImportedPatients(ORG_ID);
    return NextResponse.json({ patients });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
