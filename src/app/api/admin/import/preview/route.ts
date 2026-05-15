import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security';
import { previewImport, detectDuplicates } from '@/lib/csv-import/patient-import';

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
  const { reviewRows, dupNhiGroupCount, dupSerialGroupCount, dupContactWarnCount } =
    detectDuplicates([...preview.valid, ...preview.invalid]);

  const hasBlockers =
    preview.invalid.length > 0 ||
    reviewRows.some(r => r.severity === 'review' || r.severity === 'error');
  const hasWarnings = reviewRows.some(r => r.severity === 'warning');
  const readiness: 'ready' | 'review_required' | 'not_ready' =
    hasBlockers ? 'not_ready' :
    hasWarnings ? 'review_required' :
                  'ready';

  const portalAccessSummary = {
    requestingAccess: preview.valid.filter(r => r.enablePortalAccess).length,
    missingEmail: preview.valid.filter(r => r.enablePortalAccess && !r.email.trim()).length,
  };

  return NextResponse.json({
    totalRows: preview.totalRows,
    validCount: preview.valid.length,
    invalidCount: preview.invalid.length,
    valid: preview.valid,
    invalid: preview.invalid,
    errorSummary: preview.errorSummary,
    reviewRows,
    readiness,
    dupNhiGroupCount,
    dupSerialGroupCount,
    dupContactWarnCount,
    portalAccessSummary,
  });
}
