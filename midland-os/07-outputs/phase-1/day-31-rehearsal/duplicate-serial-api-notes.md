# Duplicate Serial API Evidence

Date: Sat May 9 2026
Result: PASS

Test:
- Authenticated admin browser console fetch to /api/admin/import/execute
- mode: execute
- Demo CSV used a new NHI but reused an existing machine serial

Observed:
- API returned HTTP 200.
- created: 0
- skipped: 1
- failed: 0
- skippedRows reason: Device with matching serial number already exists.

Conclusion:
- Duplicate machine serial protection is working.
- The system did not create a second device record for the same machine serial.
