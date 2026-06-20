import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security';
import {
  getPatientByMSID,
  getPatientDevices,
  getPatientMask,
  listPatients,
  listImportedPatients,
  updateAdminPatientDetails,
  type DeviceRecord,
  type ImportedPatientSummary,
  type MaskRecord,
  type PatientAddressStructured,
  type PatientRecord,
} from '@/lib/aws/dynamodb';
import { writeAdminAuditEvent } from '@/lib/aws/audit';

const ORG_ID = 'midland-sleep';

// Fields an admin may update through PATCH. NHI, MSID (portal_id), and
// date_of_birth are deliberately excluded — they are never written here,
// regardless of what a caller sends.
const ALLOWED_PATCH_FIELDS = new Set([
  'msid',
  'name',
  'phone',
  'email',
  'gender',
  'address',
]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanString(value: unknown, maxLength: number): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim();
  if (cleaned.length > maxLength) return undefined;
  return cleaned;
}

function parseAddress(value: unknown): PatientAddressStructured | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  return {
    line1:       cleanString(raw.line1, 120) ?? '',
    line2:       cleanString(raw.line2, 120) ?? '',
    suburb:      cleanString(raw.suburb, 80) ?? '',
    city:        cleanString(raw.city, 80) ?? '',
    region:      cleanString(raw.region, 80) ?? '',
    postal_code: cleanString(raw.postal_code, 20) ?? '',
    country:     cleanString(raw.country, 80) || 'New Zealand',
  };
}

function formatAddress(address: PatientAddressStructured): string {
  const clean = (value?: string) => value?.trim() ?? '';
  const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0;
  const segments: string[] = [];
  const pushUnique = (value: string) => {
    if (!value) return;
    if (segments.length > 0 && same(segments[segments.length - 1], value)) return;
    segments.push(value);
  };
  const line1 = clean(address.line1);
  const line2 = clean(address.line2);
  const suburb = clean(address.suburb);
  const city = clean(address.city);
  const region = clean(address.region);
  const postalCode = clean(address.postal_code);
  const country = clean(address.country);

  pushUnique(line1);
  pushUnique(line2);
  pushUnique(suburb);
  if (!suburb || !city || !same(suburb, city)) pushUnique(city);
  pushUnique([region, postalCode].filter(Boolean).join(' '));
  pushUnique(country);
  return segments.join(', ');
}

function patientPatchValue(patient: PatientRecord, key: string): unknown {
  if (key === 'address') return patient.address_structured;
  return patient[key as keyof PatientRecord];
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

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
    address_structured: patient.address_structured,
    gender: patient.gender,
    date_of_birth: patient.date_of_birth,
    funded_by: patient.funded_by,
    import_batch_id: patient.import_batch_id,
    import_row_number: patient.import_row_number,
    import_status: patient.import_status,
    review_status: patient.review_status,
    needs_outreach: patient.needs_outreach,
    safety_check_required: patient.safety_check_required,
    safety_caution_reason: patient.safety_caution_reason,
    safety_severity: patient.safety_severity,
    safety_due_date: patient.safety_due_date,
    safety_assigned_to: patient.safety_assigned_to,
    safety_resolved_note: patient.safety_resolved_note,
    safety_updated_at: patient.safety_updated_at,
    safety_updated_by_email: patient.safety_updated_by_email,
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
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
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

    const patients = await listPatients(ORG_ID);
    return NextResponse.json({ patients });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAdminUser();
  if (!user || !isAuthorizedAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_PATCH_FIELDS.has(key)) {
      return NextResponse.json({ error: `Field '${key}' cannot be updated` }, { status: 400 });
    }
  }

  const msid = cleanString(payload.msid, 32) ?? '';
  if (!/^MS-\d+$/.test(msid)) {
    return NextResponse.json({ error: 'Invalid msid' }, { status: 400 });
  }

  const fields: {
    name?: string;
    phone?: string;
    email?: string;
    gender?: string;
    address?: string;
    address_structured?: PatientAddressStructured;
  } = {};

  if (payload.name !== undefined) {
    const name = cleanString(payload.name, 120);
    if (!name) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    fields.name = name;
  }

  if (payload.phone !== undefined) {
    const phone = cleanString(payload.phone, 40);
    if (phone === undefined) return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
    fields.phone = phone;
  }

  if (payload.email !== undefined) {
    const email = cleanString(payload.email, 160);
    if (email === undefined || (email && !EMAIL_RE.test(email))) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    fields.email = email;
  }

  if (payload.gender !== undefined) {
    const gender = cleanString(payload.gender, 40);
    if (gender === undefined) return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
    fields.gender = gender;
  }

  if (payload.address !== undefined) {
    const address = parseAddress(payload.address);
    if (!address) return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    fields.address_structured = address;
    fields.address = formatAddress(address);
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  try {
    const patient = await getPatientByMSID(msid, ORG_ID);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const changedFields = Object.keys(fields).filter((key) => {
      if (key === 'address') return !valuesEqual(patient.address, fields.address);
      if (key === 'address_structured') return !valuesEqual(patientPatchValue(patient, 'address'), fields.address_structured);
      return !valuesEqual(patientPatchValue(patient, key), fields[key as keyof typeof fields]);
    });

    if (changedFields.length === 0) {
      return NextResponse.json({ error: 'No fields changed' }, { status: 400 });
    }

    // Audit-first: write the audit event before mutating. If the audit write
    // fails, abort — this endpoint is fail-closed, matching the pattern used
    // by /api/admin/patients/notes.
    const auditResult = await writeAdminAuditEvent({
      action:      'PATIENT_DETAILS_UPDATED',
      adminSub:    user.sub,
      adminEmail:  user.email,
      patientMsid: patient.portal_id ?? msid,
      details:     `Patient details updated: ${changedFields.sort().join(', ')}`,
    });
    if (!auditResult.ok) {
      return NextResponse.json({ error: 'Audit write failed — patient details not saved' }, { status: 500 });
    }

    await updateAdminPatientDetails({
      pk: patient.pk,
      fields,
      adminSub: user.sub,
      adminEmail: user.email,
    });

    const updatedPatient: PatientRecord = {
      ...patient,
      ...fields,
      updated_at: new Date().toISOString(),
      updated_by: user.sub,
      updated_by_email: user.email,
    };

    return NextResponse.json({
      ok: true,
      patient: sanitizeImportedPatient(updatedPatient),
      changed_fields: changedFields,
    });
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : 'UnknownError';
    if (errorName === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: 'Patient record could not be updated — it may have changed' }, { status: 409 });
    }
    // Safe metadata only — no raw error payloads, no identifiers.
    console.error('[patients] PATCH failed', { errorName, hasMsid: Boolean(msid), adminPresent: Boolean(user.email) });
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}
