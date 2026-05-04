import 'server-only'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { maskNHI } from '@/lib/nhi'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VerifiedUser {
  sub: string
  msid: string
  orgId: string
  name: string
  email: string
}

// Thrown by getVerifiedUser (401) and requireOrgId (403).
// Route handlers: catch HttpError and return NextResponse.json({ error }, { status })
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

// ── JWKS (lazy initialisation; avoids Amplify SSR env-var timing issue) ────────

const _region = process.env.NEXT_PUBLIC_COGNITO_REGION ?? 'ap-southeast-2'
let _JWKS: ReturnType<typeof createRemoteJWKSet> | null = null
let _issuer: string | null = null
let _clientId: string | null = null

function getJWKS() {
  if (!_JWKS) {
    const poolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    if (!poolId || !clientId) {
      throw new HttpError(500, 'Cognito env vars not configured')
    }
    _issuer = `https://cognito-idp.${_region}.amazonaws.com/${poolId}`
    _clientId = clientId
    _JWKS = createRemoteJWKSet(new URL(`${_issuer}/.well-known/jwks.json`))
  }
  return { JWKS: _JWKS, issuer: _issuer!, clientId: _clientId! }
}

// ── verifyIdToken ─────────────────────────────────────────────────────────────
// Validates signature/expiry/audience only — does not require msid or orgId.
// Use for contexts where staff tokens (no custom:msid) must also be accepted.
export async function verifyIdToken(token: string): Promise<void> {
  try {
    const { JWKS, issuer, clientId } = getJWKS()
    const { payload } = await jwtVerify<CognitoIdPayload>(token, JWKS, {
      issuer,
      audience: clientId,
    })
    if (payload.token_use !== 'id') throw new HttpError(401, 'Expected Cognito ID token')
  } catch (err) {
    if (err instanceof HttpError) throw err
    throw new HttpError(401, 'Invalid or expired token')
  }
}

// ── getVerifiedUser ───────────────────────────────────────────────────────────

interface CognitoIdPayload extends JWTPayload {
  'custom:msid'?:     string
  'custom:org_id'?:   string
  'custom:name'?:     string
  'custom:role'?:     string
  'custom:is_dev'?:   string   // stored as 'true' | 'false' in Cognito
  'cognito:username'?: string
  name?:              string
  email?:             string
  token_use?:         string
}

// ── Admin claims (staff tokens may not carry msid/orgId) ─────────────────────

export interface AdminClaims {
  sub: string
  username: string
  name: string
  email: string
  role?: string
  is_dev: boolean
}

const ADMIN_ALLOWED_ROLES = new Set(['clinic-staff', 'admin', 'staff'])
const ADMIN_ALLOWED_USERNAMES = new Set(['midland-admin'])
const ADMIN_ALLOWED_EMAILS = new Set(['admin@midlandsleep.co.nz'])

export function isAuthorizedAdmin(claims: AdminClaims): boolean {
  return (
    ADMIN_ALLOWED_ROLES.has(claims.role ?? '') ||
    claims.is_dev ||
    ADMIN_ALLOWED_USERNAMES.has(claims.username) ||
    ADMIN_ALLOWED_EMAILS.has(claims.email)
  )
}

// Reads the Cognito ID token from the `id_token` cookie (set by the admin
// login flow) and validates it. Returns null if missing or invalid.
export async function getAdminUser(): Promise<AdminClaims | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('id_token')?.value
    if (!token) return null

    const { JWKS, issuer, clientId } = getJWKS()
    const { payload } = await jwtVerify<CognitoIdPayload>(token, JWKS, {
      issuer,
      audience: clientId,
    })

    if (payload.token_use !== 'id') return null
    const { sub, email } = payload
    if (!sub || !email) return null

    const name = payload['custom:name'] ?? payload['name'] as string | undefined

    return {
      sub,
      username: payload['cognito:username'] ?? sub,
      name: name ?? 'Staff',
      email,
      role: payload['custom:role'],
      is_dev: payload['custom:is_dev'] === 'true',
    }
  } catch {
    return null
  }
}

export async function getVerifiedUser(request: NextRequest): Promise<VerifiedUser> {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing or malformed Authorization header')
  }

  let payload: CognitoIdPayload
  try {
    const { JWKS, issuer, clientId } = getJWKS()
    const result = await jwtVerify<CognitoIdPayload>(auth.slice(7), JWKS, {
      issuer,
      audience: clientId,
    })
    payload = result.payload
  } catch {
    throw new HttpError(401, 'Invalid or expired token')
  }

  if (payload.token_use !== 'id') {
    throw new HttpError(401, 'Expected Cognito ID token')
  }

  const { sub, 'custom:msid': msid, 'custom:org_id': orgId, email } = payload
  const name = payload['custom:name'] ?? payload['name'] as string | undefined

  if (!sub || !msid || !orgId || !email) {
    throw new HttpError(401, 'Token missing required claims')
  }

  return { sub, msid, orgId, name: name ?? 'Patient', email }
}

// ── safeLog ───────────────────────────────────────────────────────────────────

export function safeLog(message: string, data?: Record<string, unknown>): void {
  const msg = maskNHI(message)
  if (data === undefined) {
    console.log(msg)
    return
  }
  console.log(msg, maskNHI(JSON.stringify(data)))
}

// ── requireOrgId ──────────────────────────────────────────────────────────────

export function requireOrgId(user: VerifiedUser, requestedOrgId?: string): void {
  if (requestedOrgId !== undefined && requestedOrgId !== user.orgId) {
    throw new HttpError(403, 'Forbidden: org mismatch')
  }
}
