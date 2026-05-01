# DAY 8 — ARCHITECTURE DECISIONS
## Midland Sleep Patient Portal | Phase 1B Production
## OneOfZero Systems | Paul Alejo | May 2026

---

## Decision 001: DynamoDB Key Strategy

**Status:** LOCKED

**Context:** The `midland-sleep-patients` table needs a partition key strategy that avoids hot partitions if one clinic dominates patient volume (e.g., Midland has 90% of patients in a multi-tenant future). Using MSID or org_id as PK would concentrate all reads/writes on a single partition.

**Decision:**
- **PK:** `USER#{uuid}` — universally unique, distributes evenly across partitions
- **SK:** `PROFILE`
- **GSI1:** `portal-id-index` (PK: `portal_id`) — used for MSID login lookup
- **GSI2:** `org-patients-index` (PK: `org_id`, SK: `created_at`) — used for admin queries scoped to a clinic

**Why UUID, not MSID:**
UUID distributes writes randomly across DynamoDB partitions. If we used MSID as PK, all 4,500–6,000 patients share the same key prefix pattern and risk throttling under burst load. UUID gives us even distribution from day one and scales cleanly to 20,000+ patients across multiple clinics without rekeying.

**Why org_id GSI:**
Every DynamoDB query in production includes `org_id` as a filter or key condition. This is the multi-tenancy boundary. Even though Phase 1B has only one clinic, baking `org_id` in now means zero schema changes when clinic 2 onboards.

---

## Decision 002: Cognito Pool Configuration

**Status:** LOCKED

**Context:** Patients are often elderly, non-technical CPAP users. Staff handle clinical data and need stricter access controls. A single pool would force either too-lax security for staff or too-strict UX for patients.

**Decision: Two separate Cognito user pools.**

### Patient Pool (`midland-sleep-patients`)
- **Login:** MSID (6-digit, format MS-XXXXXX) or email (alias)
- **Username:** The 6-digit numeric portion (no MS- prefix in Cognito username)
- **MFA:** NOT required (patients are elderly, mobile-only friction is too high)
- **Account recovery:** Email only
- **Required attributes:** email
- **Custom attributes:**
  - `custom:msid` (String)
  - `custom:org_id` (String — always `"midland-sleep"` for now)
  - `custom:name` (String)
- **Auth flows:** `USER_PASSWORD_AUTH`, `USER_SRP_AUTH`
- **Token validity:** Access = 1 hour, ID = 1 hour, Refresh = 30 days
- **App client:** `midland-portal-web` — no client secret (public web client)

### Staff Pool (`midland-sleep-staff`)
- **Login:** Email only
- **MFA:** REQUIRED (TOTP — authenticator app)
- **Groups:** `midland-staff` (admin), `midland-dev` (dev users)
- **Auth flows:** Same as patient pool
- **Token validity:** Same as patient pool

**Why two pools:**
Compromise of one pool doesn't affect the other. Staff need MFA enforced at the pool level, not as an optional setting patients might accidentally trigger. Separate pools also mean separate password policies, token lifetimes, and audit trails if needed in future.

---

## Decision 003: NHI Encryption Key Rotation

**Status:** LOCKED

**Context:** NHI (National Health Index) numbers are the most sensitive data in the system. They're encrypted at rest using AES-256-GCM with the key stored in AWS Secrets Manager (not environment variables). The question is whether to enable Secrets Manager's automated rotation.

**Decision: Manual rotation only. Annual review.**

**Rationale:**
- Automated rotation adds a Lambda function, cross-version decryption logic, and a re-encryption migration step — significant complexity for a solo developer
- At this scale (one clinic, one key), the attack surface for key compromise is narrow: the key is accessed only by the Amplify runtime role and never leaves AWS
- Annual review during the Month 12 contract conversation is sufficient
- If Midland scales to 5+ clinics or a security audit recommends it, automated rotation can be added then — the Secrets Manager API is the same either way

**Key management rules:**
- Dev key and prod key are separate secrets in Secrets Manager
- NHI encryption key is NEVER stored in `.env`, `.env.local`, or any file in the repo
- The Amplify runtime IAM role has `secretsmanager:GetSecretValue` permission for the production key only
- Dev key is accessible only from the dev environment

---

## Decision 004: Phase 2 Code Isolation

**Status:** LOCKED (see also ADR 006 — Stripe Shop Dormant in 1B)

**Context:** Phase 1A includes a working shop and checkout demo with Stripe test mode. Phase 1B production does NOT deploy shop or checkout — these are reactivated at the Month 12 contract review. The code needs to exist in the repo (for reference and future reactivation) but must be completely unreachable in production.

**Decision:**
- Shop code lives in `src/phase2/shop/`
- Checkout code lives in `src/phase2/checkout/`
- Cart provider lives in `src/phase2/CartProvider.tsx`
- Product catalogue lives in `src/phase2/products.ts`
- **No production route imports anything from `src/phase2/`**
- A CI/CD quality gate script (`scripts/check-phase2-imports.sh`) blocks any import from `src/phase2/` in production code
- The production sidebar has 6 items (no Shop link)
- The production top bar has no cart icon

**CI/CD enforcement:**
```bash
#!/bin/bash
# scripts/check-phase2-imports.sh
# Blocks production code from importing Phase 2 modules
VIOLATIONS=$(grep -r "from.*phase2" src/app/ src/components/ src/lib/ 2>/dev/null | grep -v node_modules)
if [ -n "$VIOLATIONS" ]; then
  echo "ERROR: Production code imports Phase 2 modules:"
  echo "$VIOLATIONS"
  exit 1
fi
echo "OK: No Phase 2 imports in production code"
```

**Reactivation path:**
Month 12 → contract review → agree scope + revenue share → move `src/phase2/` contents into `src/app/portal/shop/` and `src/app/portal/checkout/` → add Stripe production keys → deploy.

---

## Decision 005: All 7 DynamoDB Tables

**Status:** LOCKED

All tables use `PAY_PER_REQUEST` billing and have deletion protection ENABLED.

| # | Table | PK | SK | GSIs | Notes |
|---|-------|----|----|------|-------|
| 1 | `midland-sleep-patients` | `USER#{uuid}` | `PROFILE` | `portal-id-index`, `org-patients-index` | Main patient record |
| 2 | `midland-sleep-devices` | `DEVICE#{id}` | `PATIENT#{patientId}` | `patient-devices` (PK: `patient_id`) | CPAP machines |
| 3 | `midland-sleep-masks` | `MASK#{id}` | `PATIENT#{patientId}` | — | Masks + cushions |
| 4 | `midland-sleep-entitlement` | `PATIENT#{patientId}` | `YEAR#{2026}` | — | Government funding caps + usage |
| 5 | `midland-sleep-orders` | `USER#{patientId}` | `ORDER#{timestamp}` | — | `order_type: ENTITLEMENT \| MIXED` only. No `PURCHASE` in 1B. |
| 6 | `midland-sleep-audit` | `AUDIT#{userId}` | `EVENT#{timestamp_ms}` | — | **APPEND-ONLY.** `PutItem` only. No `UpdateItem`/`DeleteItem` ever. IAM-enforced. |
| 7 | `midland-sleep-comms` | `PATIENT#{patientId}` | `COMM#{timestamp}` | — | Contact form submissions |

**Tables NOT created in Phase 1B:**
- ~~midland-sleep-points~~ (removed — no Midland Points)
- ~~midland-sleep-consultations~~ (removed — no paid consultations)
- ~~midland-sleep-stripe-payments~~ (Phase 2 only)

---

## Decision 006: Region Selection

**Status:** LOCKED

**Region:** `ap-southeast-2` (Sydney)

**Why:** Closest AWS region to New Zealand. HIPC Rule 12 requires a Cloud Risk Assessment for offshore data processing — this is Midland's responsibility, and OneOfZero provides supporting documentation. All data stays in this single region for Phase 1B. Multi-region disaster recovery is a Year 2+ consideration only.

---

*These decisions are final for Phase 1B. Any changes require a new ADR with rationale.*
*OneOfZero Systems | Midland Sleep | May 2026*
