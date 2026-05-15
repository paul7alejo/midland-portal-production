// CSV Import — connects to DynamoDB in Day 18
// Real encryption via nhi.ts encryptNHI() before any write
// Never log raw NHI values — use maskNHI() in all logs

export interface RawCSVRow {
  first_name?: string
  last_name?: string
  full_name?: string
  nhi?: string
  date_of_birth?: string
  phone?: string
  email?: string
  address?: string
  machine_brand?: string
  machine_model?: string
  machine_serial?: string
  machine_setup_date?: string
  mask_brand?: string
  mask_model?: string
  mask_size?: string
  funded_by?: string
  enable_portal_access?: string
}

export interface ParsedPatient {
  fullName: string
  nhi: string
  dateOfBirth: string
  phone: string
  email: string
  address: string
  enablePortalAccess: boolean
  machine: {
    brand: string
    model: string
    serial: string
    setupDate: string
    fundedBy: string
  }
  mask: {
    brand: string
    model: string
    size: string
  }
  importErrors: string[]
  rowNumber?: number
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
}

export function parsePatientCSV(csvText: string): ParsedPatient[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = normalizeHeaders(parseCSVLine(lines[0]));
  const patients: ParsedPatient[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim();
    });

    const errors: string[] = [];

    let fullName = row['full_name'] ?? '';
    if (!fullName) {
      const first = row['first_name'] ?? '';
      const last = row['last_name'] ?? '';
      if (first || last) {
        fullName = `${first} ${last}`.trim();
      } else {
        errors.push('Missing required field: full_name (or first_name + last_name)');
      }
    }

    const nhi = row['nhi'] ?? '';
    if (!nhi) {
      errors.push('Missing required field: nhi');
    }

    const machineSerial = row['machine_serial'] ?? '';
    if (!machineSerial) {
      errors.push('Missing required field: machine_serial');
    }

    const enablePortalAccess = ['true', 'yes', '1'].includes(
      (row['enable_portal_access'] ?? '').toLowerCase().trim()
    )

    patients.push({
      fullName,
      nhi,
      dateOfBirth: row['date_of_birth'] ?? '',
      phone: row['phone'] ?? '',
      email: row['email'] ?? '',
      address: row['address'] ?? '',
      enablePortalAccess,
      machine: {
        brand: row['machine_brand'] ?? '',
        model: row['machine_model'] ?? '',
        serial: machineSerial,
        setupDate: row['machine_setup_date'] ?? '',
        fundedBy: row['funded_by'] ?? '',
      },
      mask: {
        brand: row['mask_brand'] ?? '',
        model: row['mask_model'] ?? '',
        size: row['mask_size'] ?? '',
      },
      importErrors: errors,
      rowNumber: i + 1,
    });
  }

  return patients;
}

export function validateParsedPatient(p: ParsedPatient): string[] {
  const errors: string[] = [];

  // TODO: support newer NHI formats (e.g. 3 letters + 2 digits + 2 letters + 1 digit)
  if (!p.nhi || !/^[A-Z]{3}[0-9]{4}$/.test(p.nhi)) {
    errors.push(`Invalid NHI format: expected 3 uppercase letters followed by 4 digits`);
  }

  if (p.dateOfBirth) {
    const parsed = Date.parse(p.dateOfBirth);
    if (isNaN(parsed)) {
      errors.push(`Unparseable date_of_birth: "${p.dateOfBirth}"`);
    }
  }

  if (!p.machine.serial) {
    errors.push('Machine serial must not be empty');
  }

  return errors;
}

export function generateMSID(): string {
  // TODO: check DynamoDB for conflicts before production use
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `MS-${digits}`;
}

export function previewImport(csvText: string): {
  valid: ParsedPatient[]
  invalid: ParsedPatient[]
  totalRows: number
  errorSummary: string[]
} {
  const rows = parsePatientCSV(csvText);

  const valid: ParsedPatient[] = [];
  const invalid: ParsedPatient[] = [];
  const errorSummary: string[] = [];

  for (const row of rows) {
    const validationErrors = validateParsedPatient(row);
    const allErrors = [...row.importErrors, ...validationErrors];

    if (allErrors.length === 0) {
      valid.push(row);
    } else {
      invalid.push({ ...row, importErrors: allErrors });
      errorSummary.push(...allErrors);
    }
  }

  return {
    valid,
    invalid,
    totalRows: rows.length,
    errorSummary: [...new Set(errorSummary)],
  };
}

// ─── Duplicate detection ──────────────────────────────────────────────────────

export type IssueSeverity = 'error' | 'warning' | 'review'

export type IssueType =
  | 'duplicate_nhi'
  | 'duplicate_serial'
  | 'duplicate_email'
  | 'duplicate_phone'

export interface ReviewRow {
  rowNumber: number
  name: string
  maskedNhi: string
  machineSerial: string
  issueType: IssueType
  issueDetail: string
  severity: IssueSeverity
}

export function detectDuplicates(allRows: ParsedPatient[]): {
  reviewRows: ReviewRow[]
  dupNhiGroupCount: number
  dupSerialGroupCount: number
  dupContactWarnCount: number
} {
  const nhiMap    = new Map<string, number[]>()
  const serialMap = new Map<string, number[]>()
  const emailMap  = new Map<string, number[]>()
  const phoneMap  = new Map<string, number[]>()

  allRows.forEach((row, i) => {
    const n = row.rowNumber ?? (i + 1)
    if (row.nhi)            nhiMap.set(row.nhi.toUpperCase(),               [...(nhiMap.get(row.nhi.toUpperCase())               ?? []), n])
    if (row.machine.serial) serialMap.set(row.machine.serial.trim(),        [...(serialMap.get(row.machine.serial.trim())        ?? []), n])
    if (row.email)          emailMap.set(row.email.toLowerCase().trim(),    [...(emailMap.get(row.email.toLowerCase().trim())    ?? []), n])
    if (row.phone)          phoneMap.set(row.phone.replace(/\s+/g, ''),     [...(phoneMap.get(row.phone.replace(/\s+/g, ''))     ?? []), n])
  })

  const reviewRows: ReviewRow[] = []

  allRows.forEach((row, i) => {
    const n = row.rowNumber ?? (i + 1)
    const maskedNhi = row.nhi ? row.nhi.slice(0, 3) + '****' : '—'

    if (row.nhi) {
      const rows = nhiMap.get(row.nhi.toUpperCase()) ?? []
      if (rows.length > 1) {
        const others = rows.filter(r => r !== n)
        reviewRows.push({
          rowNumber: n, name: row.fullName, maskedNhi,
          machineSerial: row.machine.serial,
          issueType: 'duplicate_nhi',
          issueDetail: `NHI also appears on row${others.length > 1 ? 's' : ''} ${others.join(', ')}`,
          severity: 'review',
        })
      }
    }

    if (row.machine.serial) {
      const rows = serialMap.get(row.machine.serial.trim()) ?? []
      if (rows.length > 1) {
        const others = rows.filter(r => r !== n)
        reviewRows.push({
          rowNumber: n, name: row.fullName, maskedNhi,
          machineSerial: row.machine.serial,
          issueType: 'duplicate_serial',
          issueDetail: `Serial also appears on row${others.length > 1 ? 's' : ''} ${others.join(', ')}`,
          severity: 'review',
        })
      }
    }

    if (row.email) {
      const rows = emailMap.get(row.email.toLowerCase().trim()) ?? []
      if (rows.length > 1) {
        const others = rows.filter(r => r !== n)
        reviewRows.push({
          rowNumber: n, name: row.fullName, maskedNhi,
          machineSerial: row.machine.serial,
          issueType: 'duplicate_email',
          issueDetail: `Email also appears on row${others.length > 1 ? 's' : ''} ${others.join(', ')}`,
          severity: 'warning',
        })
      }
    }

    if (row.phone) {
      const rows = phoneMap.get(row.phone.replace(/\s+/g, '')) ?? []
      if (rows.length > 1) {
        const others = rows.filter(r => r !== n)
        reviewRows.push({
          rowNumber: n, name: row.fullName, maskedNhi,
          machineSerial: row.machine.serial,
          issueType: 'duplicate_phone',
          issueDetail: `Phone also appears on row${others.length > 1 ? 's' : ''} ${others.join(', ')}`,
          severity: 'warning',
        })
      }
    }
  })

  let dupNhiGroupCount = 0
  nhiMap.forEach(rows => { if (rows.length > 1) dupNhiGroupCount++ })

  let dupSerialGroupCount = 0
  serialMap.forEach(rows => { if (rows.length > 1) dupSerialGroupCount++ })

  const dupContactWarnCount = reviewRows.filter(r => r.severity === 'warning').length

  return { reviewRows, dupNhiGroupCount, dupSerialGroupCount, dupContactWarnCount }
}
