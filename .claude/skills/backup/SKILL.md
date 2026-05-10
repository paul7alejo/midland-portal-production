# /backup
Implement or modify backup logic.
## Three layers
1. DynamoDB PITR — all 7 tables, 35-day rolling
2. On-demand backup — admin triggers with reason, audit before create
3. Weekly S3 snapshot — Lambda, Sunday 02:00 NZT, encrypted, versioned
## Rules (Backup Discipline — Rule 18)
- Audit PutItem BEFORE create_backup
- S3 bucket: encrypted, versioned, public access BLOCKED
- CloudWatch alarm on Lambda failure
- Restore NOT exposed in portal (Rule 17, AWS console only)
- Backup smoke test in every release SOP
- Reference: midland-os/03-technical/admin-data-operations.md
- Reference: midland-os/04-sops/backup-sop.md
