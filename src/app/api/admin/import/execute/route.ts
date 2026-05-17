import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security';
import {
  previewImport,
  detectDuplicates,
  generateMSID,
  type ParsedPatient,
} from '@/lib/csv-import/patient-import';
import { buildManifest, computePreflightState } from '@/lib/csv-import/import-preflight';
import {
  getDeviceBySerialNumber,
  getPatientByMSID,
  getPatientByNhiHash,
  putImportedDevice,
  putImportedMask,
  putImportedPatient,
  type DeviceRecord,
  type MaskRecord,
  type PatientRecord,
} from '@/lib/aws/dynamodb';
import { encryptNHI, hashNHIForSearch } from '@/lib/nhi';
import { randomUUID } from 'crypto';
import { createPatientPortalUser } from '@/lib/aws/cognito-admin';

type Readiness = 'ready' | 'review_required' | 'not_ready';

const ORG_ID = 'midland-sleep';

type CreatedImportRow = {
  rowNumber: number;
  name: string;
  patientId: string;
  portalId: string;
  deviceId: string;
  maskId?: string;
  machineSerial: string;
};

type ReportedImportRow = {
  rowNumber: number;
  name: string;
  machineSerial: string;
  reason: string;
};

type PortalUserCreated = {
  rowNumber: number;
  name: string;
  portalId: string;
  username: string;
  temporaryPassword: string;
};

type PortalUserOutcome = {
  rowNumber: number;
  name: string;
  reason: string;
};

function getRowNumber(row: ParsedPatient): number {
  return row.rowNumber ?? 0;
}

function getMachineName(row: ParsedPatient): string {
  const name = `${row.machine.brand} ${row.machine.model}`.trim();
  return name || row.machine.model || row.machine.brand || 'CPAP machine';
}

function getMaskName(row: ParsedPatient): string {
  const name = `${row.mask.brand} ${row.mask.model}`.trim();
  return name || row.mask.model || row.mask.brand || 'CPAP mask';
}

function hasMaskData(row: ParsedPatient): boolean {
  return Boolean(row.mask.brand.trim() || row.mask.model.trim() || row.mask.size.trim());
}

function inferMaskType(row: ParsedPatient): MaskRecord['type'] {
  const value = `${row.mask.model} ${row.mask.size}`.toLowerCase();
  if (value.includes('pillow')) return 'nasal_pillows';
  if (value.includes('full') || value.includes('face')) return 'full_face';
  return 'nasal';
}

async function generateUniquePortalId(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const portalId = generateMSID();
    const existing = await getPatientByMSID(portalId, ORG_ID);
    if (!existing) return portalId;
  }
  throw new Error('Unable to allocate patient portal ID');
}

function classifyImportError(err: unknown): string {
  if (!(err instanceof Error)) return 'Unexpected error during import';
  const name = err.name ?? '';
  const msg = err.message ?? '';
  if (msg.includes('NHI_ENCRYPTION_KEY') || msg.includes('NHI_HASH_SALT')) {
    return 'NHI encryption configuration missing — contact system administrator';
  }
  if (name === 'ConditionalCheckFailedException') {
    return 'Duplicate patient or machine serial — record already exists';
  }
  if (name === 'ValidationException') {
    return 'DynamoDB validation failed during patient import';
  }
  if (name === 'ResourceNotFoundException') {
    return 'DynamoDB resource not found — check table and index configuration';
  }
  if (name === 'AccessDeniedException') {
    return 'Insufficient IAM permissions for DynamoDB write';
  }
  if (msg.includes('Unable to allocate patient portal ID')) {
    return 'Could not allocate unique patient portal ID — retry the import';
  }
  return 'Failed to import row — check server logs for details';
}

function toReportedRow(row: ParsedPatient, reason: string): ReportedImportRow {
  return {
    rowNumber: getRowNumber(row),
    name: row.fullName,
    machineSerial: row.machine.serial,
    reason,
  };
}

function getReadiness(params: {
  invalidCount: number;
  reviewRows: Array<{ severity: string }>;
}): Readiness {
  const hasBlockers =
    params.invalidCount > 0 ||
    params.reviewRows.some((r) => r.severity === 'review' || r.severity === 'error');
  const hasWarnings = params.reviewRows.some((r) => r.severity === 'warning');

  if (hasBlockers) return 'not_ready';
  if (hasWarnings) return 'review_required';
  return 'ready';
}

function getBlockReasons(params: {
  invalidCount: number;
  dupNhiGroupCount: number;
  dupSerialGroupCount: number;
  dupContactWarnCount: number;
}): string[] {
  const reasons: string[] = [];
  const hasHardBlockers =
    params.invalidCount > 0 ||
    params.dupNhiGroupCount > 0 ||
    params.dupSerialGroupCount > 0;

  if (params.invalidCount > 0) {
    reasons.push('Invalid rows must be corrected before import.');
  }
  if (params.dupNhiGroupCount > 0) {
    reasons.push('Duplicate NHI conflicts must be resolved before import.');
  }
  if (params.dupSerialGroupCount > 0) {
    reasons.push('Duplicate machine serial conflicts must be resolved before import.');
  }
  if (!hasHardBlockers && params.dupContactWarnCount > 0) {
    reasons.push('Shared contact details require admin review.');
  }
  return reasons;
}

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user || !isAuthorizedAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { csv, mode } = body as { csv?: unknown; mode?: unknown };
  if (typeof csv !== 'string') {
    return NextResponse.json({ error: 'CSV data is required' }, { status: 400 });
  }
  if (!csv.trim()) {
    return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 });
  }
  if (mode !== 'dry_run' && mode !== 'execute') {
    return NextResponse.json({ error: 'Unsupported import mode' }, { status: 400 });
  }

  try {
    const preview = previewImport(csv);
    const allRows = [...preview.valid, ...preview.invalid];
    const { reviewRows, dupNhiGroupCount, dupSerialGroupCount, dupContactWarnCount } =
      detectDuplicates(allRows);

    const readiness = getReadiness({
      invalidCount: preview.invalid.length,
      reviewRows,
    });

    const preflightState = computePreflightState({
      invalidCount: preview.invalid.length,
      dupNhiGroupCount,
      dupSerialGroupCount,
      dupContactWarnCount,
      reviewRowCount: reviewRows.length,
    });

    const manifest = buildManifest({
      valid: preview.valid,
      invalid: preview.invalid,
      reviewRows,
    });

    const blockReasons = getBlockReasons({
      invalidCount: preview.invalid.length,
      dupNhiGroupCount,
      dupSerialGroupCount,
      dupContactWarnCount,
    });

    if (mode === 'dry_run') {
      const wouldCreate = preflightState === 'passed' ? preview.valid.length : 0;
      const wouldFail = preview.invalid.length;
      const wouldSkip = preflightState === 'passed' ? 0 : reviewRows.length;

      return NextResponse.json({
        mode: 'dry_run',
        importEnabled: false,
        message: 'Dry run only. No patient records were created or updated.',
        summary: {
          totalRows: preview.totalRows,
          validRows: preview.valid.length,
          invalidRows: preview.invalid.length,
          reviewRows: reviewRows.length,
          duplicateNhiGroups: dupNhiGroupCount,
          duplicateSerialGroups: dupSerialGroupCount,
          contactWarnings: dupContactWarnCount,
          readiness,
          preflightState,
          wouldCreate,
          wouldSkip,
          wouldFail,
        },
        blocked: preflightState === 'blocked',
        blockReasons,
        manifest,
      });
    }

    if (preflightState !== 'passed') {
      const failedRows = preview.invalid.map((row) =>
        toReportedRow(row, row.importErrors.join('; ') || 'Invalid row'),
      );
      const skippedRows = manifest
        .filter((row) => row.validationStatus === 'valid' && row.preflightStatus !== 'passed')
        .map((row) => ({
          rowNumber: row.rowNumber,
          name: row.name,
          machineSerial: row.machineSerial,
          reason: row.issues || 'Preflight review required',
        }));

      return NextResponse.json(
        {
          mode: 'execute',
          importBatchId: null,
          message: 'Import preflight did not pass. No records were created.',
          summary: {
            totalRows: preview.totalRows,
            validRows: preview.valid.length,
            invalidRows: preview.invalid.length,
            created: 0,
            skipped: skippedRows.length,
            failed: failedRows.length,
            preflightState,
          },
          createdRows: [],
          skippedRows,
          failedRows,
        },
        { status: 400 },
      );
    }

    const importBatchId = randomUUID();
    const createdAt = new Date().toISOString();
    const createdBy = user.email || user.username || user.sub;
    const createdRows: CreatedImportRow[] = [];
    const skippedRows: ReportedImportRow[] = [];
    const failedRows: ReportedImportRow[] = [];
    const portalUsersCreated: PortalUserCreated[] = [];
    const portalUsersAlreadyExisted: PortalUserOutcome[] = [];
    const portalUserFailures: PortalUserOutcome[] = [];

    for (const row of preview.valid) {
      try {
        const normalizedNhi = row.nhi.toUpperCase();
        const nhiHash = await hashNHIForSearch(normalizedNhi);
        const existingPatient = await getPatientByNhiHash(nhiHash, ORG_ID);
        if (existingPatient) {
          skippedRows.push(toReportedRow(row, 'Patient with matching NHI already exists'));
          continue;
        }

        const serialNumber = row.machine.serial.trim();
        const existingDevice = await getDeviceBySerialNumber(serialNumber, ORG_ID);
        if (existingDevice) {
          skippedRows.push(toReportedRow(row, 'Device with matching serial number already exists'));
          continue;
        }

        const patientId = randomUUID();
        const deviceId = randomUUID();
        const rowNumber = getRowNumber(row);

        let portalId: string;
        const csvPortalId = row.csvPortalId?.trim();
        if (csvPortalId) {
          if (!/^MS-\d{6}$/.test(csvPortalId)) {
            skippedRows.push(toReportedRow(row, `Invalid portal_id format in CSV: "${csvPortalId}" — expected MS-XXXXXX`));
            continue;
          }
          const existingWithPortalId = await getPatientByMSID(csvPortalId, ORG_ID);
          if (existingWithPortalId) {
            skippedRows.push(toReportedRow(row, `Portal ID ${csvPortalId} is already assigned to another patient`));
            continue;
          }
          portalId = csvPortalId;
        } else {
          portalId = await generateUniquePortalId();
        }
        const importMetadata = {
          import_batch_id: importBatchId,
          import_row_number: rowNumber,
          import_source: 'admin_csv' as const,
          import_status: 'imported' as const,
          review_status: 'pending_review' as const,
          created_at: createdAt,
          created_by: createdBy,
        };

        const patientRecord: PatientRecord = {
          pk: `USER#${patientId}`,
          sk: 'PROFILE',
          patient_id: patientId,
          portal_id: portalId,
          org_id: ORG_ID,
          name: row.fullName,
          email: row.email,
          ...(row.dateOfBirth && { date_of_birth: row.dateOfBirth }),
          ...(row.phone && { phone: row.phone }),
          ...(row.address && { address: row.address }),
          ...(row.machine.fundedBy && { funded_by: row.machine.fundedBy }),
          nhi_encrypted: await encryptNHI(normalizedNhi),
          nhi_hash: nhiHash,
          ...importMetadata,
        };
        const deviceRecord: DeviceRecord = {
          pk: `DEVICE#${deviceId}`,
          sk: `PATIENT#${patientId}`,
          org_id: ORG_ID,
          device_id: deviceId,
          patient_id: patientId,
          name: getMachineName(row),
          brand: row.machine.brand,
          model: row.machine.model,
          serial_number: serialNumber,
          setup_date: row.machine.setupDate,
          ...(row.machine.fundedBy && { funded_by: row.machine.fundedBy }),
          ...importMetadata,
        };

        await putImportedPatient(patientRecord);
        await putImportedDevice(deviceRecord);

        const createdRow: CreatedImportRow = {
          rowNumber,
          name: row.fullName,
          patientId,
          portalId,
          deviceId,
          machineSerial: serialNumber,
        };

        if (hasMaskData(row)) {
          const maskId = randomUUID();
          const maskRecord: MaskRecord = {
            pk: `MASK#${maskId}`,
            sk: `PATIENT#${patientId}`,
            org_id: ORG_ID,
            mask_id: maskId,
            patient_id: patientId,
            name: getMaskName(row),
            brand: row.mask.brand,
            ...(row.mask.model && { model: row.mask.model }),
            type: inferMaskType(row),
            size: row.mask.size,
            fitted_date: row.machine.setupDate,
            ...importMetadata,
          };

          await putImportedMask(maskRecord);
          createdRow.maskId = maskId;
        }

        createdRows.push(createdRow);

        // Cognito portal access — only if requested
        if (row.enablePortalAccess) {
          if (!row.email.trim()) {
            portalUserFailures.push({
              rowNumber,
              name: row.fullName,
              reason: 'Missing email — portal access skipped',
            });
          } else {
            const username = portalId.replace('MS-', '');
            const cognitoResult = await createPatientPortalUser({
              username,
              msid: portalId,
              orgId: ORG_ID,
              email: row.email.trim(),
              name: row.fullName,
            });
            if (cognitoResult.status === 'created') {
              portalUsersCreated.push({
                rowNumber,
                name: row.fullName,
                portalId,
                username,
                temporaryPassword: cognitoResult.temporaryPassword,
              });
            } else if (cognitoResult.status === 'already_exists') {
              portalUsersAlreadyExisted.push({ rowNumber, name: row.fullName, reason: 'Already login-enabled' });
            } else if (cognitoResult.status === 'msid_conflict') {
              portalUserFailures.push({
                rowNumber,
                name: row.fullName,
                reason: 'Cognito username already assigned to a different patient — portal access blocked',
              });
            } else {
              portalUserFailures.push({ rowNumber, name: row.fullName, reason: cognitoResult.message });
            }
          }
        }
      } catch (err) {
        console.error('[import/execute] row failed', {
          rowNumber: getRowNumber(row),
          importBatchId,
          errorName: err instanceof Error ? err.name : typeof err,
          errorMessage: err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200),
        });
        failedRows.push(toReportedRow(row, classifyImportError(err)));
      }
    }

    return NextResponse.json({
      mode: 'execute',
      importBatchId,
      message: `Import complete. Created ${createdRows.length} row${createdRows.length === 1 ? '' : 's'}.`,
      summary: {
        totalRows: preview.totalRows,
        validRows: preview.valid.length,
        invalidRows: preview.invalid.length,
        created: createdRows.length,
        skipped: skippedRows.length,
        failed: failedRows.length,
        preflightState,
        portalUsersCreated: portalUsersCreated.length,
        portalUsersAlreadyExisted: portalUsersAlreadyExisted.length,
        portalUserFailures: portalUserFailures.length,
      },
      createdRows,
      skippedRows,
      failedRows,
      portalUsersCreated,
      portalUsersAlreadyExisted,
      portalUserFailures,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
