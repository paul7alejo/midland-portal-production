import 'server-only'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'

interface NHISecret {
  encryptionKey: string
  hashSalt: string
}

let _cache: { value: NHISecret; expiresAt: number } | null = null
const CACHE_TTL_MS = 60 * 60 * 1000

const client = new SecretsManagerClient({
  region: process.env.DYNAMODB_REGION ?? 'ap-southeast-2',
})

async function getSecret(): Promise<NHISecret> {
  const now = Date.now()
  if (_cache && _cache.expiresAt > now) return _cache.value

  const res = await client.send(
    new GetSecretValueCommand({ SecretId: process.env.NHI_SECRET_NAME! })
  )
  if (!res.SecretString) throw new Error('NHI secret is empty')

  const value: NHISecret = JSON.parse(res.SecretString)
  _cache = { value, expiresAt: now + CACHE_TTL_MS }
  return value
}

// Returns base64url: 12-byte IV || ciphertext || 16-byte GCM auth tag
export async function encryptNHI(nhi: string): Promise<string> {
  const { encryptionKey } = await getSecret()
  const key = Buffer.from(encryptionKey, 'hex')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(nhi, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, ct, tag]).toString('base64url')
}

export async function decryptNHI(token: string): Promise<string> {
  const { encryptionKey } = await getSecret()
  const key = Buffer.from(encryptionKey, 'hex')
  const payload = Buffer.from(token, 'base64url')
  const iv = payload.subarray(0, 12)
  const tag = payload.subarray(payload.length - 16)
  const ct = payload.subarray(12, payload.length - 16)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}

// HMAC-SHA-256: deterministic search token, same NHI always yields the same digest
export async function hashNHIForSearch(nhi: string): Promise<string> {
  const { hashSalt } = await getSecret()
  return createHmac('sha256', hashSalt).update(nhi).digest('hex')
}

// Sync — no key needed
export function maskNHI(nhi: string): string {
  return nhi.replace(/[A-Z]{3}\d{4}/g, 'ZZZ****')
}
