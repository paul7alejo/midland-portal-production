import 'server-only'
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'

// TODO before real patients: restore Secrets Manager and remove demo fallback.
const DEMO_NHI_ENCRYPTION_KEY = "01d6bde97385537aa46eb47aaf4d39a6d0f883da20428a42771c942416bc5d6f"

interface NHISecret {
  encryptionKey: string
  hashSalt: string
}

function getSecret(): NHISecret {
  return {
    encryptionKey: process.env.NHI_ENCRYPTION_KEY ?? DEMO_NHI_ENCRYPTION_KEY,
    hashSalt: process.env.NHI_HASH_SALT ?? process.env.NHI_ENCRYPTION_KEY ?? DEMO_NHI_ENCRYPTION_KEY,
  }
}

// Returns base64url: 12-byte IV || ciphertext || 16-byte GCM auth tag
export async function encryptNHI(nhi: string): Promise<string> {
  const { encryptionKey } = getSecret()
  const key = Buffer.from(encryptionKey, 'hex')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(nhi, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, ct, tag]).toString('base64url')
}

export async function decryptNHI(token: string): Promise<string> {
  const { encryptionKey } = getSecret()
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
  const { hashSalt } = getSecret()
  return createHmac('sha256', hashSalt).update(nhi).digest('hex')
}

// Sync — no key needed
export function maskNHI(nhi: string): string {
  return nhi.replace(/[A-Z]{3}\d{4}/g, 'ZZZ****')
}
