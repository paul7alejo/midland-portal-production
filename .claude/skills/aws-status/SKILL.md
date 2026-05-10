# /aws-status
Implement or modify the AWS State Visibility panel.
## Endpoint
GET /api/admin/aws-status
## Returns
- Per-table: record count, size, last write, PITR status, encryption, deletion protection
- Cognito: patient/staff pool user counts
- Backup: last on-demand, last weekly snapshot, alarm status
- S3: bucket name, object count, size, public access blocked, versioning
## Rules
- READ-ONLY — no destructive operations (Rule 17)
- Uses DynamoDB describe-table, describe-backup, describe-continuous-backups
- Admin role + org_id check
- No patient data in response
- Verify: npx tsc --noEmit
