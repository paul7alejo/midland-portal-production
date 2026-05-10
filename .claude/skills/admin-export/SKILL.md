# /admin-export
Implement or modify an admin export endpoint.
## Endpoints
POST /api/admin/exports/imported-patients
POST /api/admin/exports/combined
POST /api/admin/exports/entitlement
POST /api/admin/exports/audit-window
## Rules (Export Hygiene — Rule 16)
- NHI EXCLUDED by default
- include_nhi: true requires non-empty reason
- Audit PutItem BEFORE file generation
- Download URL: single-use, 24h expiring, watermarked filename
- CSV escaping: comma, quote, newline, BOM
- safeLog only — no console.log
- No patient identifier in URL
- Server-side filtering only
- Verify: npx tsc --noEmit
- Reference: midland-os/03-technical/admin-data-operations.md
