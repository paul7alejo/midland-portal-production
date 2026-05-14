import 'server-only'
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'

interface NHISecret {
  encryptionKey: string
  hashSalt: string
}

function getSecret(): NHISecret {
  const encryptionKey = process.env.NHI_ENCRYPTION_KEY
  const hashSalt = process.env.NHI_HASH_SALT ?? process.env.NHI_ENCRYPTION_KEY

  if (!encryptionKey) throw new Error('NHI_ENCRYPTION_KEY is not set')
  if (!hashSalt) throw new Error('NHI_HASH_SALT is not set')

  return { encryptionKey, hashSalt }
}

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

export async function hashNHIForSearch(nhi: string): Promise<string> {
  const { hashSalt } = getSecret()
  return createHmac('sha256', hashSalt).update(nhi).digest('hex')
}

export function maskNHI(nhi: string): string {
  return nhi.replace(/[A-Z]{3}\d{4}/g, 'ZZZ****')
}