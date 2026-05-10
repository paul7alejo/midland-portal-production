# Reusable Modules

> Components extracted from Midland that work for any clinic with minimal config.

| Module | What it does | Config per clinic |
|---|---|---|
| Import engine | CSV → validate → dry-run → execute → DynamoDB | column mapping, validation rules |
| Admin review | list → drawer → status → export | brand, org_id filter |
| Export bridge | 4 CSV types, NHI-excluded default | column set per clinic data model |
| Backup discipline | PITR + on-demand + weekly S3 | S3 prefix, Lambda schedule |
| AWS state visibility | read-only describe-table panel | table names |
| Audit system | append-only PutItem, IAM-enforced | action types per clinic workflow |
| Entitlement model | YES/NO display, never dollar amount | eligibility rules, funded items |
| Auth model | 2 Cognito pools, MFA for staff | pool config, MFA policy |
| OS documentation | SOPs, decisions, risks, handover | clinic-specific content |
| Brand kit | colours, typography, logo | per-clinic config file |

## What is NOT reusable (custom per clinic)

```text
- product taxonomy (CPAP vs orthotics vs hearing aids)
- clinical workflow specifics
- funding rules (different govt programmes)
- data source format (ALTER vs PMS vs spreadsheet)
- compliance specifics (HIPC vs other frameworks)
- staff training content
```
