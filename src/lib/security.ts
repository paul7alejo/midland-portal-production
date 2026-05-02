import 'server-only'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { NextRequest } from 'next/server'
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

// ── JWKS (module-level; jose caches and refreshes on unknown kid) ─────────────

const poolId   = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!
const region   = process.env.NEXT_PUBLIC_COGNITO_REGION ?? 'ap-southeast-2'
const issuer   = `https://cognito-idp.${region}.amazonaws.com/${poolId}`

const JWKS = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))

// ── getVerifiedUser ───────────────────────────────────────────────────────────

interface CognitoIdPayload extends JWTPayload {
  'custom:msid'?:   string
  'custom:org_id'?: string
  'custom:name'?:   string
  email?:           string
  token_use?:       string
}

export async function getVerifiedUser(request: NextRequest): Promise<VerifiedUser> {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing or malformed Authorization header')
  }

  let payload: CognitoIdPayload
  try {
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

  const { sub, 'custom:msid': msid, 'custom:org_id': orgId,
          'custom:name': name, email } = payload

  if (!sub || !msid || !orgId || !name || !email) {
    throw new HttpError(401, 'Token missing required claims')
  }

  return { sub, msid, orgId, name, email }
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
