import type { ParsedPatient, ReviewRow } from './patient-import'

export type PreflightState   = 'passed' | 'review_required' | 'blocked'
export type ValidationStatus = 'valid'  | 'invalid'

export interface ImportManifestRow {
  rowNumber:        number
  name:             string
  maskedNhi:        string
  fundedBy:         string
  machineSerial:    string
  validationStatus: ValidationStatus
  preflightStatus:  PreflightState
  issues:           string
}

function maskNhi(nhi: string): string {
  if (!nhi) return '—'
  return `${nhi.toUpperCase().slice(0, 3)}****`
}

export function computePreflightState(params: {
  invalidCount:        number
  dupNhiGroupCount:    number
  dupSerialGroupCount: number
  dupContactWarnCount: number
  reviewRowCount:      number
}): PreflightState {
  if (
    params.invalidCount        > 0 ||
    params.dupNhiGroupCount    > 0 ||
    params.dupSerialGroupCount > 0
  ) return 'blocked'
  if (params.dupContactWarnCount > 0 || params.reviewRowCount > 0) return 'review_required'
  return 'passed'
}

export function buildManifest(params: {
  valid:      ParsedPatient[]
  invalid:    ParsedPatient[]
  reviewRows: ReviewRow[]
}): ImportManifestRow[] {
  const { valid, invalid, reviewRows } = params

  // Index reviewRows by rowNumber for O(1) lookup
  const reviewMap = new Map<number, ReviewRow[]>()
  for (const rr of reviewRows) {
    const existing = reviewMap.get(rr.rowNumber) ?? []
    reviewMap.set(rr.rowNumber, [...existing, rr])
  }

  function toManifestRow(row: ParsedPatient, vs: ValidationStatus): ImportManifestRow {
    const rn = row.rowNumber ?? 0
    const maskedNhi = maskNhi(row.nhi)
    const matching = reviewMap.get(rn) ?? []

    const issuesParts: string[] = []
    if (vs === 'invalid') issuesParts.push(...row.importErrors)
    issuesParts.push(...matching.map(r => r.issueDetail))
    const issues = issuesParts.join('; ')

    let preflightStatus: PreflightState = 'passed'
    if (vs === 'invalid' || matching.some(r => r.severity === 'review' || r.severity === 'error')) {
      preflightStatus = 'blocked'
    } else if (matching.some(r => r.severity === 'warning')) {
      preflightStatus = 'review_required'
    }

    return {
      rowNumber: rn,
      name: row.fullName,
      maskedNhi,
      fundedBy: row.machine.fundedBy,
      machineSerial: row.machine.serial,
      validationStatus: vs,
      preflightStatus,
      issues,
    }
  }

  const rows: ImportManifestRow[] = [
    ...valid.map(r   => toManifestRow(r, 'valid')),
    ...invalid.map(r => toManifestRow(r, 'invalid')),
  ]

  rows.sort((a, b) => a.rowNumber - b.rowNumber)
  return rows
}
