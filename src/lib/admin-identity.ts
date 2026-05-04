const ADMIN_ROLES = new Set(['clinic-staff', 'admin', 'staff'])
const ADMIN_USERNAMES = new Set(['midland-admin'])
const ADMIN_EMAILS = new Set(['admin@midlandsleep.co.nz'])

export function isAdminIdentity(user: {
  username?: string
  email?: string
  role?: string
}): boolean {
  return (
    ADMIN_ROLES.has(user.role ?? '') ||
    ADMIN_USERNAMES.has(user.username ?? '') ||
    ADMIN_EMAILS.has(user.email ?? '')
  )
}
