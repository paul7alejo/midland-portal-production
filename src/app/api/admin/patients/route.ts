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

interface ImportedPatientExportRow {
  patientName: string;
  portalId: string;
  phone: string;
  funding: string;
  machineBrand: string;
  machineModel: string;
  machineSerial: string;
  maskBrand: string;
  maskModel: string;
  maskSize: string;
  importBatchId: string;
  reviewStatus: string;
  importedAt: string;
}

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

function safeCsvValue(value?: string | number | null): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

function humanizeLabel(value?: string): string {
  const normalized = value?.trim();
  if (!normalized) return '';
  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (char) => char.toUpperCase());
}

function formatNzDateTime(value?: string): string {
  if (!value?.trim()) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Pacific/Auckland',
  }).format(date);
}

function csvEscape(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsv(rows: ImportedPatientExportRow[]): string {
  const columns: Array<[keyof ImportedPatientExportRow, string]> = [
    ['patientName', 'Patient name'],
    ['portalId', 'MSID / portal ID'],
    ['phone', 'Phone'],
    ['funding', 'Funding'],
    ['machineBrand', 'Machine brand'],
    ['machineModel', 'Machine model'],
    ['machineSerial', 'Machine serial'],
    ['maskBrand', 'Mask brand'],
    ['maskModel', 'Mask model'],
    ['maskSize', 'Mask size'],
    ['importBatchId', 'Import batch ID'],
    ['reviewStatus', 'Review status'],
    ['importedAt', 'Imported at'],
  ];

  const header = columns.map(([, label]) => csvEscape(label)).join(',');
  const body = rows.map((row) =>
    columns.map(([key]) => csvEscape(safeCsvValue(row[key]))).join(',')
  );

  return [header, ...body].join('\r\n');
}

async function buildImportedPatientExportRows(): Promise<ImportedPatientExportRow[]> {
  const patients = await listImportedPatients(ORG_ID);
  return Promise.all(
    patients.map(async (patient) => {
      const [devices, mask] = await Promise.all([
        getPatientDevices(patient.patient_id, ORG_ID),
        getPatientMask(patient.patient_id, ORG_ID),
      ]);
      const device = devices[0];

      return {
        patientName: safeCsvValue(patient.name),
        portalId: safeCsvValue(patient.portal_id),
        phone: safeCsvValue(patient.phone),
        funding: safeCsvValue(patient.funded_by),
        machineBrand: safeCsvValue(device?.brand),
        machineModel: safeCsvValue(device?.model),
        machineSerial: safeCsvValue(device?.serial_number),
        maskBrand: safeCsvValue(mask?.brand),
        maskModel: safeCsvValue(mask?.model),
        maskSize: safeCsvValue(mask?.size),
        importBatchId: safeCsvValue(patient.import_batch_id),
        reviewStatus: humanizeLabel(patient.review_status),
        importedAt: formatNzDateTime(patient.created_at),
      };
    })
  );
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
  const exportFormat = request.nextUrl.searchParams.get('export')?.trim().toLowerCase();

  try {
    if (exportFormat) {
      if (exportFormat !== 'csv') {
        return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 });
      }

      const rows = await buildImportedPatientExportRows();
      const csv = buildCsv(rows);
      const date = new Date().toISOString().slice(0, 10);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="imported-patients-${date}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

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
