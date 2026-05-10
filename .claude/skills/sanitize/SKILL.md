# /sanitize
Sanitise inputs / outputs / logs for PII.
## Rules
- Replace console.log with safeLog in patient data paths
- Ensure maskNHI wraps any NHI before logging
- Strip PII from error messages returned to client
- No patient identifiers in URLs
- No full NHI in CloudWatch logs
- Verify: npx tsc --noEmit
