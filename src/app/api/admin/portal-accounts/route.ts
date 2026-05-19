import 'server-only'
import { NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { listPortalUsers } from '@/lib/aws/cognito-admin'
import type { PortalAccount } from '@/components/admin/PortalAccountsTable'

export async function GET() {
  const user = await getAdminUser()
  if (!user || !isAuthorizedAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const users = await listPortalUsers()
    const accounts: PortalAccount[] = users.map((u) => ({
      id:             u.username,
      name:           u.name || u.msid,
      msid:           u.msid,
      nhiMasked:      '—',
      createdAt:      u.createdAt,
      passwordStatus: u.userStatus === 'FORCE_CHANGE_PASSWORD' ? 'temp' : 'changed',
      twoFa:          false,
      accountStatus:  u.enabled ? 'active' : 'locked',
    }))
    return NextResponse.json({ accounts })
  } catch {
    return NextResponse.json({ error: 'Failed to load portal accounts' }, { status: 500 })
  }
}
