import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security';
import { previewImport, detectDuplicates, type ParsedPatient } from '@/lib/csv-import/patient-import';
import { getPatientByNhiHash, getDeviceBySerialNumber } from '@/lib/aws/dynamodb';
import { hashNHIForSearch, NhiSecretError, type NhiSecretErrorCode } from '@/lib/nhi';

const ORG_ID = 'midland-sleep';

type DiagDetail = NhiSecretErrorCode | 'duplicate_lookup' | 'unknown';

function failPreview(detail: DiagDetail, err: unknown): NextResponse {
  const code = 'IMPORT_PREVIEW_BACKEND_ERROR';
  const name = err instanceof Error ? err.name : 'UnknownError';
  const awsRequestId = (err as { $metadata?: { requestId?: string } })?.$metadata?.requestId;
  console.error('[import-preview]', { code, detail, name, ...(awsRequestId ? { awsRequestId } : {}) });
  return NextResponse.json({ error: 'Import preview failed', code, detail }, { status: 500 });
}

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user || !isAuthorizedAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let csv: string;
  try {
    const body = await request.json();
    csv = typeof body?.csv === 'string' ? body.csv : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!csv.trim()) {
    return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 });
  }

  const preview = previewImport(csv);

  // DB-level duplicate detection — read-only, valid rows only.
  // Rows that collide with existing DB records are reclassified as invalid so
  // they flow through the same blocking path as CSV-invalid rows
  // (result.invalid.length > 0 → invalidCount > 0 → preflightState 'blocked').
  const dbErrors = new Map<number, string[]>();

  for (const row of preview.valid) {
    const rowNum = row.rowNumber ?? 0;
    const errors: string[] = [];

    if (row.nhi) {
      let nhiHash: string;
      try {
        nhiHash = await hashNHIForSearch(row.nhi.toUpperCase());
      } catch (err) {
        return failPreview(err instanceof NhiSecretError ? err.code : 'nhi_hash_unknown', err);
      }

      let existingPatient: Awaited<ReturnType<typeof getPatientByNhiHash>>;
      try {
        existingPatient = await getPatientByNhiHash(nhiHash, ORG_ID);
      } catch (err) {
        return failPreview('duplicate_lookup', err);
      }

      if (existingPatient) {
        errors.push('Patient with matching NHI already exists in database');
      }
    }

    const serialNumber = row.machine.serial.trim();
    if (serialNumber) {
      let existingDevice: Awaited<ReturnType<typeof getDeviceBySerialNumber>>;
      try {
        existingDevice = await getDeviceBySerialNumber(serialNumber, ORG_ID);
      } catch (err) {
        return failPreview('duplicate_lookup', err);
      }

      if (existingDevice) {
        errors.push('Machine serial already exists in database');
      }
    }

    if (errors.length > 0) {
      dbErrors.set(rowNum, errors);
    }
  }

  // Split valid rows: DB-blocked ones become invalid, clean ones stay valid.
  const dbInvalidRows: ParsedPatient[] = preview.valid
    .filter(r => dbErrors.has(r.rowNumber ?? 0))
    .map(r => ({ ...r, importErrors: dbErrors.get(r.rowNumber ?? 0)! }));

  const cleanValid = preview.valid.filter(r => !dbErrors.has(r.rowNumber ?? 0));
  const allInvalid = [...preview.invalid, ...dbInvalidRows];

  const {
    reviewRows,
    dupNhiGroupCount,
    dupSerialGroupCount,
    dupContactWarnCount,
  } = detectDuplicates([...cleanValid, ...allInvalid]);

  const hasBlockers =
    allInvalid.length > 0 ||
    reviewRows.some(r => r.severity === 'review' || r.severity === 'error');
  const hasWarnings = reviewRows.some(r => r.severity === 'warning');
  const readiness: 'ready' | 'review_required' | 'not_ready' =
    hasBlockers   ? 'not_ready' :
    hasWarnings   ? 'review_required' :
                    'ready';

  const portalAccessSummary = {
    requestingAccess: cleanValid.filter(r => r.enablePortalAccess).length,
    missingEmail:     cleanValid.filter(r => r.enablePortalAccess && !r.email.trim()).length,
  };

  return NextResponse.json({
    totalRows:          preview.totalRows,
    validCount:         cleanValid.length,
    invalidCount:       allInvalid.length,
    valid:              cleanValid,
    invalid:            allInvalid,
    errorSummary:       preview.errorSummary,
    reviewRows,
    readiness,
    dupNhiGroupCount,
    dupSerialGroupCount,
    dupContactWarnCount,
    portalAccessSummary,
  });
}
