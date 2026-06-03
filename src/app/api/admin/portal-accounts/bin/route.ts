import 'server-only'
import { NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { listArchivedPatientSummaries } from '@/lib/aws/dynamodb'

const ORG_ID = 'midland-sleep'

export async function GET() {
  const user = await getAdminUser()
  if (!user || !isAuthorizedAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const archived = await listArchivedPatientSummaries(ORG_ID)
    const bin = archived.map(p => ({
      msid:            p.portal_id,
      name:            p.name,
      archivedAt:      p.archived_at,
      archivedByEmail: p.archived_by_email,
      purgeAfter:      p.purge_after,
    }))
    return NextResponse.json({ bin })
  } catch {
    return NextResponse.json({ error: 'Failed to load bin' }, { status: 500 })
  }
}
