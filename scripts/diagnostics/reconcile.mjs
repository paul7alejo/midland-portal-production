/**
 * scripts/diagnostics/reconcile.mjs
 *
 * READ-ONLY cross-reference of Patients, Portal Accounts, and Orders.
 * Outputs counts to stdout — no writes, no mutations.
 *
 * Usage (requires a running dev/prod server with a valid admin session cookie):
 *
 *   ADMIN_COOKIE="midland.session=<value>" node scripts/diagnostics/reconcile.mjs
 *
 * Or with a base URL override:
 *
 *   BASE_URL=https://your-domain.com ADMIN_COOKIE="..." node scripts/diagnostics/reconcile.mjs
 */

const BASE_URL  = process.env.BASE_URL  ?? 'http://localhost:3000'
const COOKIE    = process.env.ADMIN_COOKIE ?? ''

if (!COOKIE) {
  console.error('ERROR: ADMIN_COOKIE env var is required (e.g. ADMIN_COOKIE="midland.session=...")')
  process.exit(1)
}

const headers = { Cookie: COOKIE, 'Content-Type': 'application/json' }

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers })
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`)
  return res.json()
}

async function main() {
  console.log('Midland Sleep — Patients / Portal Accounts / Orders Reconciliation')
  console.log('='.repeat(70))
  console.log(`Base URL : ${BASE_URL}`)
  console.log(`Run at   : ${new Date().toISOString()}`)
  console.log()

  // ── Fetch all three sources ──────────────────────────────────────────────────
  console.log('Fetching data…')
  const [patientsData, accountsData, ordersData] = await Promise.all([
    apiFetch('/api/admin/patients'),
    apiFetch('/api/admin/portal-accounts'),
    apiFetch('/api/admin/orders'),
  ])

  const patients = patientsData.patients ?? []
  const accounts = accountsData.accounts ?? []
  const orders   = ordersData.orders ?? []

  // ── Index by MSID ────────────────────────────────────────────────────────────
  const patientMsids  = new Set(patients.map(p => p.portal_id?.trim().toLowerCase()).filter(Boolean))
  const accountMsids  = new Set(accounts.map(a => a.msid?.trim().toLowerCase()).filter(Boolean))
  const ordersByMsid  = new Map()

  for (const o of orders) {
    const msid = o.msid?.trim().toLowerCase()
    if (!msid) continue
    if (!ordersByMsid.has(msid)) ordersByMsid.set(msid, [])
    ordersByMsid.get(msid).push(o)
  }

  // ── Summary counts ────────────────────────────────────────────────────────────
  const patientsWithAccount    = patients.filter(p => accountMsids.has(p.portal_id?.trim().toLowerCase())).length
  const patientsWithoutAccount = patients.length - patientsWithAccount
  const accountsWithoutPatient = accounts.filter(a => !patientMsids.has(a.msid?.trim().toLowerCase())).length

  // Patient sub-categories
  const pendingReview   = patients.filter(p => !p.review_status || p.review_status === 'pending_review').length
  const reviewed        = patients.filter(p => p.review_status === 'reviewed').length
  const needsOutreach   = patients.filter(p => p.needs_outreach === true).length
  const safetyCheckDue  = patients.filter(p => p.safety_check_required === true).length

  // Portal account sub-categories
  const tempPassword    = accounts.filter(a => a.passwordStatus === 'temp').length
  const passwordChanged = accounts.filter(a => a.passwordStatus === 'changed').length
  const locked          = accounts.filter(a => a.accountStatus === 'locked').length

  // Order cross-references
  const realOrders             = orders.filter(o => o.source !== 'admin_created' && !o.isDemo && !o.localOnly)
  const ordersMatchingPatient  = realOrders.filter(o => patientMsids.has(o.msid?.trim().toLowerCase()))
  const ordersMissingPatient   = realOrders.filter(o => !patientMsids.has(o.msid?.trim().toLowerCase()))
  const ordersWithPortalAcct   = realOrders.filter(o => accountMsids.has(o.msid?.trim().toLowerCase()))
  const ordersWithoutPortalAcct = realOrders.filter(o => !accountMsids.has(o.msid?.trim().toLowerCase()))
  const adminCreatedOrders     = orders.filter(o => o.source === 'admin_created')

  // Funding review
  const needsFundingReview = realOrders.filter(o => o.needsFundingReview === true).length

  // Order status breakdown
  const statusCounts = {}
  for (const o of realOrders) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1
  }

  // ── Print report ─────────────────────────────────────────────────────────────
  console.log('── PATIENTS (' + patients.length + ' total) ──────────────────────────────────────')
  console.log(`  Total patients          : ${patients.length}`)
  console.log(`  Pending review          : ${pendingReview}`)
  console.log(`  Reviewed                : ${reviewed}`)
  console.log(`  Needs outreach          : ${needsOutreach}`)
  console.log(`  Safety check required   : ${safetyCheckDue}`)
  console.log()

  console.log('── PORTAL ACCOUNTS (' + accounts.length + ' total) ──────────────────────────────')
  console.log(`  Total accounts          : ${accounts.length}`)
  console.log(`  Password changed        : ${passwordChanged}`)
  console.log(`  Temp password           : ${tempPassword}`)
  console.log(`  Locked                  : ${locked}`)
  console.log()

  console.log('── ORDERS (' + orders.length + ' total) ──────────────────────────────────────────')
  console.log(`  Total orders (all)      : ${orders.length}`)
  console.log(`  Real orders (non-admin) : ${realOrders.length}`)
  console.log(`  Admin-created orders    : ${adminCreatedOrders.length}`)
  console.log(`  Needs funding review    : ${needsFundingReview}`)
  console.log()
  console.log('  Status breakdown (real orders):')
  for (const [status, count] of Object.entries(statusCounts).sort()) {
    console.log(`    ${String(status).padEnd(20)}: ${count}`)
  }
  console.log()

  console.log('── CROSS-REFERENCE ──────────────────────────────────────────────────')
  console.log(`  Patients with portal account    : ${patientsWithAccount}`)
  console.log(`  Patients WITHOUT portal account : ${patientsWithoutAccount}`)
  console.log(`  Portal accounts WITHOUT patient : ${accountsWithoutPatient}`)
  console.log()
  console.log(`  Real orders → matching patient  : ${ordersMatchingPatient.length}`)
  console.log(`  Real orders → missing patient   : ${ordersMissingPatient.length}`)
  console.log(`  Real orders → linked portal acct: ${ordersWithPortalAcct.length}`)
  console.log(`  Real orders → no portal acct    : ${ordersWithoutPortalAcct.length}`)
  console.log()

  if (accountsWithoutPatient > 0) {
    console.log('  ⚠  Portal accounts with no matching patient record:')
    for (const a of accounts.filter(a => !patientMsids.has(a.msid?.trim().toLowerCase()))) {
      console.log(`     MSID: ${a.msid}  name: ${a.name}  status: ${a.accountStatus}`)
    }
    console.log()
  }

  if (ordersMissingPatient.length > 0) {
    console.log('  ⚠  Real orders missing a patient record (first 10):')
    for (const o of ordersMissingPatient.slice(0, 10)) {
      console.log(`     MSID: ${o.msid}  requestId: ${o.requestId}  status: ${o.status}  source: ${o.source}`)
    }
    console.log()
  }

  console.log('Done.')
}

main().catch(err => {
  console.error('FATAL:', err.message)
  process.exit(1)
})
