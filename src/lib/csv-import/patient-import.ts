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
}

export interface ParsedPatient {
  fullName: string
  nhi: string
  dateOfBirth: string
  phone: string
  email: string
  address: string
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

    patients.push({
      fullName,
      nhi,
      dateOfBirth: row['date_of_birth'] ?? '',
      phone: row['phone'] ?? '',
      email: row['email'] ?? '',
      address: row['address'] ?? '',
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
