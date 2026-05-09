# Duplicate NHI API Evidence

Date: Sat May 9 2026
Result: PASS

Test:
- Authenticated admin browser console fetch to /api/admin/import/execute
- mode: execute
- Demo CSV used same NHI as existing imported demo patient
- Machine serial was different to isolate duplicate NHI behavior

Observed:
- API returned HTTP 200.
- created: 0
- skipped: 1
- failed: 0
- skippedRows reason: Patient with matching NHI already exists.

Conclusion:
- Duplicate NHI protection is working.
- The system did not create a second patient record for the same NHI.
