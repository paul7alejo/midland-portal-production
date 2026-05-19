import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security';
import { previewImport, detectDuplicates, type ParsedPatient } from '@/lib/csv-import/patient-import';
import { getPatientByNhiHash, getDeviceBySerialNumber } from '@/lib/aws/dynamodb';
import { hashNHIForSearch, NhiSecretError, type NhiSecretErrorCode } from '@/lib/nhi';

const ORG_ID = 'midland-sleep';

type DiagDetail = NhiSecretErrorCode | 'duplicate_lookup' | 'unknown';
type FailingStep = 'patient_nhi_duplicate_lookup' | 'device_serial_duplicate_lookup';

function safeLen(v: string | undefined): number {
  return v ? v.length : 0;
}

function buildEnvDiag() {
  const nhiSecretName    = process.env.NHI_SECRET_NAME;
  const nhiEncryptionKey = process.env.NHI_ENCRYPTION_KEY;
  const nhiHashSalt      = process.env.NHI_HASH_SALT;
  const dynamoDbRegion   = process.env.DYNAMODB_REGION;
  const awsRegion        = process.env.AWS_REGION;
  return {
    hasNhiSecretName:       !!nhiSecretName,
    nhiSecretNameLength:    safeLen(nhiSecretName),
    hasNhiEncryptionKey:    !!nhiEncryptionKey,
    nhiEncryptionKeyLength: safeLen(nhiEncryptionKey),
    hasNhiHashSalt:         !!nhiHashSalt,
    nhiHashSaltLength:      safeLen(nhiHashSalt),
    hasDynamoDbRegion:      !!dynamoDbRegion,
    dynamoDbRegionLength:   safeLen(dynamoDbRegion),
    hasAwsRegion:           !!awsRegion,
    awsRegionLength:        safeLen(awsRegion),
  };
}

function buildDynDiag() {
  return {
    hasDynamoDbRegion:     !!process.env.DYNAMODB_REGION,
    dynamoDbRegionLength:  safeLen(process.env.DYNAMODB_REGION),
    hasAwsRegion:          !!process.env.AWS_REGION,
    awsRegionLength:       safeLen(process.env.AWS_REGION),
    hasMidlandAccessKeyId: !!process.env.MIDLAND_ACCESS_KEY_ID,
  };
}

function failPreview(detail: DiagDetail, err: unknown, failingStep?: FailingStep): NextResponse {
  const code = 'IMPORT_PREVIEW_BACKEND_ERROR';
  const name = err instanceof Error ? err.name : 'UnknownError';
  const errorName = err instanceof NhiSecretError
    ? err.originalName
    : (err instanceof Error ? err.name : undefined);
  const awsMeta = (err as { $metadata?: { requestId?: string; httpStatusCode?: number } })?.$metadata;
  const awsRequestId   = awsMeta?.requestId;
  const httpStatusCode = awsMeta?.httpStatusCode;
  const envDiag = detail === 'nhi_secret_env_missing' ? buildEnvDiag() : undefined;
  const dynDiag = detail === 'duplicate_lookup'        ? buildDynDiag() : undefined;
  console.error('[import-preview]', {
    code, detail, name,
    ...(errorName      ? { errorName }      : {}),
    ...(awsRequestId   ? { awsRequestId }   : {}),
    ...(httpStatusCode ? { httpStatusCode } : {}),
    ...(failingStep    ? { failingStep }    : {}),
    ...(envDiag        ? { envDiag }        : {}),
    ...(dynDiag        ? { dynDiag }        : {}),
  });
  return NextResponse.json(
    {
      error: 'Import preview failed', code, detail,
      ...(errorName      ? { errorName }      : {}),
      ...(awsRequestId   ? { awsRequestId }   : {}),
      ...(httpStatusCode ? { httpStatusCode } : {}),
      ...(failingStep    ? { failingStep }    : {}),
      ...(envDiag        ? { envDiag }        : {}),
      ...(dynDiag        ? { dynDiag }        : {}),
    },
    { status: 500 },
  );
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
        return failPreview('duplicate_lookup', err, 'patient_nhi_duplicate_lookup');
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
        return failPreview('duplicate_lookup', err, 'device_serial_duplicate_lookup');
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
