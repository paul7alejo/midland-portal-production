import 'server-only'
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  type GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager'

interface NHISecret {
  encryptionKey: string
  hashSalt: string
}

export type NhiSecretErrorCode =
  | 'nhi_secret_env_missing'
  | 'nhi_secret_access_denied'
  | 'nhi_secret_not_found'
  | 'nhi_secret_decryption_failure'
  | 'nhi_secret_invalid_json'
  | 'nhi_secret_missing_encryption_key'
  | 'nhi_secret_missing_hash_salt'
  | 'nhi_hash_unknown'

export class NhiSecretError extends Error {
  readonly code: NhiSecretErrorCode
  constructor(code: NhiSecretErrorCode) {
    super(code)
    this.name = 'NhiSecretError'
    this.code = code
  }
}

let cachedSecret: NHISecret | null = null

const smClient = new SecretsManagerClient({
  region: process.env.DYNAMODB_REGION ?? process.env.AWS_REGION ?? 'ap-southeast-2',
})

async function loadSecret(): Promise<NHISecret> {
  if (cachedSecret) return cachedSecret

  const secretName = process.env.NHI_SECRET_NAME

  if (secretName) {
    let smResponse: GetSecretValueCommandOutput
    try {
      smResponse = await smClient.send(new GetSecretValueCommand({ SecretId: secretName }))
    } catch (err) {
      const errName = err instanceof Error ? err.name : ''
      if (errName === 'AccessDeniedException')   throw new NhiSecretError('nhi_secret_access_denied')
      if (errName === 'ResourceNotFoundException') throw new NhiSecretError('nhi_secret_not_found')
      if (errName === 'DecryptionFailure')         throw new NhiSecretError('nhi_secret_decryption_failure')
      throw new NhiSecretError('nhi_hash_unknown')
    }

    const raw = smResponse.SecretString
    if (!raw) throw new NhiSecretError('nhi_hash_unknown')

    let parsed: Record<string, string>
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new NhiSecretError('nhi_secret_invalid_json')
    }

    const encryptionKey = parsed['encryptionKey'] ?? parsed['NHI_ENCRYPTION_KEY']
    const hashSalt = parsed['hashSalt'] ?? parsed['NHI_HASH_SALT'] ?? encryptionKey

    if (!encryptionKey) throw new NhiSecretError('nhi_secret_missing_encryption_key')
    if (!hashSalt)      throw new NhiSecretError('nhi_secret_missing_hash_salt')

    cachedSecret = { encryptionKey, hashSalt }
    return cachedSecret
  }

  // Local development: fall back to env vars
  const encryptionKey = process.env.NHI_ENCRYPTION_KEY
  const hashSalt = process.env.NHI_HASH_SALT ?? process.env.NHI_ENCRYPTION_KEY

  if (!encryptionKey) throw new NhiSecretError('nhi_secret_env_missing')
  if (!hashSalt)      throw new NhiSecretError('nhi_secret_env_missing')

  cachedSecret = { encryptionKey, hashSalt }
  return cachedSecret
}

export async function encryptNHI(nhi: string): Promise<string> {
  const { encryptionKey } = await loadSecret()
  const key = Buffer.from(encryptionKey, 'hex')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(nhi, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, ct, tag]).toString('base64url')
}

export async function decryptNHI(token: string): Promise<string> {
  const { encryptionKey } = await loadSecret()
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
  const { hashSalt } = await loadSecret()
  return createHmac('sha256', hashSalt).update(nhi).digest('hex')
}

export function maskNHI(nhi: string): string {
  return nhi.replace(/[A-Z]{3}\d{4}/g, 'ZZZ****')
}
