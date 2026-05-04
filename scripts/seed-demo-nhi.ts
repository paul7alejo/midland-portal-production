// Run: npx tsx scripts/seed-demo-nhi.ts
// Requires env vars: DYNAMODB_REGION, NHI_ENCRYPTION_KEY (hex),
//                    MIDLAND_ACCESS_KEY_ID, MIDLAND_SECRET_ACCESS_KEY

import { createCipheriv, randomBytes } from 'crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const DEMO_PATIENTS: { msid: string; nhi: string }[] = [
  { msid: 'MS-238872', nhi: 'ZZA1234' },
  { msid: 'MS-731204', nhi: 'ZZB5678' },
  { msid: 'MS-956431', nhi: 'ZZC9012' },
]

const ORG_ID = 'midland-sleep'
const TABLE_PATIENTS = 'midland-sleep-patients'

// Matches the pack format in src/lib/nhi.ts: base64url(iv || ciphertext || authTag)
function encryptNHI(nhi: string): string {
  const keyHex = process.env.NHI_ENCRYPTION_KEY
  if (!keyHex) throw new Error('NHI_ENCRYPTION_KEY env var is not set')
  const key = Buffer.from(keyHex, 'hex')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(nhi, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, ct, tag]).toString('base64url')
}

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.DYNAMODB_REGION ?? 'ap-southeast-2',
    ...(process.env.MIDLAND_ACCESS_KEY_ID && {
      credentials: {
        accessKeyId: process.env.MIDLAND_ACCESS_KEY_ID,
        secretAccessKey: process.env.MIDLAND_SECRET_ACCESS_KEY!,
      },
    }),
  })
)

async function getPatientPk(msid: string, orgId: string): Promise<string | null> {
  const res = await docClient.send(new QueryCommand({
    TableName: TABLE_PATIENTS,
    IndexName: 'portal_id-index',
    KeyConditionExpression: 'portal_id = :msid',
    FilterExpression: 'org_id = :orgId',
    ExpressionAttributeValues: { ':msid': msid, ':orgId': orgId },
    Limit: 1,
  }))
  const item = res.Items?.[0] as { pk: string } | undefined
  return item?.pk ?? null
}

async function seed(): Promise<void> {
  for (const { msid, nhi } of DEMO_PATIENTS) {
    const pk = await getPatientPk(msid, ORG_ID)
    if (!pk) {
      console.error(`❌ Patient not found: ${msid}`)
      continue
    }

    const nhi_encrypted = encryptNHI(nhi)

    await docClient.send(new UpdateCommand({
      TableName: TABLE_PATIENTS,
      Key: { pk, sk: 'PROFILE' },
      UpdateExpression: 'SET nhi_encrypted = :enc, nhi_masked = :masked, updated_at = :ts',
      ExpressionAttributeValues: {
        ':enc': nhi_encrypted,
        ':masked': 'ZZZ****',
        ':ts': new Date().toISOString(),
      },
    }))

    console.log(`✅ NHI seeded for ${msid}`)
  }
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
