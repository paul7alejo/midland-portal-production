import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security';
import { previewImport, detectDuplicates } from '@/lib/csv-import/patient-import';
import { buildManifest, computePreflightState } from '@/lib/csv-import/import-preflight';

type Readiness = 'ready' | 'review_required' | 'not_ready';

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
  if (mode !== 'dry_run') {
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

    const wouldCreate = preflightState === 'passed' ? preview.valid.length : 0;
    const wouldFail = preview.invalid.length;
    const wouldSkip = preflightState === 'passed' ? 0 : reviewRows.length;
    const blockReasons = getBlockReasons({
      invalidCount: preview.invalid.length,
      dupNhiGroupCount,
      dupSerialGroupCount,
      dupContactWarnCount,
    });

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
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
