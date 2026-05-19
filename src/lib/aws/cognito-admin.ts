import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminEnableUserCommand,
  ListUsersCommand,
  type UserType,
} from '@aws-sdk/client-cognito-identity-provider'
import { randomBytes } from 'crypto'

const region = process.env.DYNAMODB_REGION ?? process.env.AWS_REGION ?? 'ap-southeast-2'

const USER_POOL_ID = process.env.COGNITO_PATIENT_USER_POOL_ID!

const client = new CognitoIdentityProviderClient({
  region,
  ...(process.env.MIDLAND_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId:     process.env.MIDLAND_ACCESS_KEY_ID,
      secretAccessKey: process.env.MIDLAND_SECRET_ACCESS_KEY!,
    },
  }),
})

export type PortalUserResult =
  | { status: 'created'; temporaryPassword: string }
  | { status: 'already_exists' }
  | { status: 'msid_conflict' }
  | { status: 'error'; message: string }

function generateTemporaryPassword(): string {
  const upper  = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const lower  = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const all    = upper + lower + digits

  // 16 bytes: 8 for suffix content, bytes[8..14] for Fisher-Yates shuffle
  const bytes = randomBytes(16)

  // Seed 8-char suffix with explicit guaranteed slots first, then fill randomly.
  // "Midland!" prefix already covers uppercase(M), lowercase(idland), special(!).
  // Suffix adds two guaranteed digits plus one each of upper/lower for redundancy.
  const parts: string[] = [
    upper[bytes[0] % upper.length],
    lower[bytes[1] % lower.length],
    digits[bytes[2] % digits.length],
    digits[bytes[3] % digits.length],
    all[bytes[4] % all.length],
    all[bytes[5] % all.length],
    all[bytes[6] % all.length],
    all[bytes[7] % all.length],
  ]

  // Fisher-Yates shuffle so guaranteed chars don't always appear at fixed positions
  for (let i = parts.length - 1; i > 0; i--) {
    const j = bytes[15 - i] % (i + 1)
    ;[parts[i], parts[j]] = [parts[j], parts[i]]
  }

  // Total: 16 chars — uppercase, lowercase, special, digit all guaranteed
  return 'Midland!' + parts.join('')
}

export async function createPatientPortalUser(params: {
  username: string    // number-only, e.g. "731204"
  msid: string        // "MS-731204"
  orgId: string       // "midland-sleep"
  email: string
  name: string
}): Promise<PortalUserResult> {
  const { username, msid, orgId, email, name } = params

  // Check if username already exists in the pool
  try {
    const existing = await client.send(new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    }))
    const existingMsid = existing.UserAttributes?.find(a => a.Name === 'custom:msid')?.Value
    if (existingMsid === msid) {
      return { status: 'already_exists' }
    }
    // Username taken by a different patient — do not overwrite
    return { status: 'msid_conflict' }
  } catch (err: unknown) {
    if ((err as { name?: string }).name !== 'UserNotFoundException') {
      return {
        status: 'error',
        message: err instanceof Error ? err.message : 'Error checking existing user',
      }
    }
    // User does not exist — proceed to create
  }

  const temporaryPassword = generateTemporaryPassword()

  // Create user without TemporaryPassword — Cognito may auto-generate and ignore an
  // explicitly provided one when MessageAction is SUPPRESS on some pool configurations.
  // We set the exact known password immediately after via AdminSetUserPassword.
  try {
    await client.send(new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'custom:msid',   Value: msid },
        { Name: 'custom:org_id', Value: orgId },
        { Name: 'email',         Value: email },
        { Name: 'name',          Value: name },
      ],
    }))
  } catch (err: unknown) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to create portal user',
    }
  }

  // Permanent: false preserves FORCE_CHANGE_PASSWORD status and sets exactly the
  // password that will be displayed to the admin — no auto-generated value can interfere.
  try {
    await client.send(new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: temporaryPassword,
      Permanent: false,
    }))
  } catch (err: unknown) {
    const errorName    = err instanceof Error ? err.name : 'UnknownError'
    const errorMessage = err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300)
    const meta = (err as { $metadata?: { httpStatusCode?: number; requestId?: string } }).$metadata

    console.error('[cognito-admin] AdminSetUserPassword failed', {
      username,  // number-only portal username — not a secret
      errorName,
      errorMessage,
      httpStatusCode: meta?.httpStatusCode,
      requestId:      meta?.requestId,
    })

    const message =
      errorName === 'AccessDeniedException'
        ? 'Portal user created but runtime AWS credentials cannot set temporary password (check cognito-idp:AdminSetUserPassword IAM permission)'
        : errorName === 'InvalidPasswordException'
          ? 'Portal user created but generated temporary password did not meet Cognito policy'
          : errorName === 'ResourceNotFoundException' || errorName === 'UserNotFoundException'
            ? 'Portal user created but could not be found for password setup'
            : 'Portal user created but temporary password could not be set'

    return { status: 'error', message }
  }

  return { status: 'created', temporaryPassword }
}

export type ResetPasswordResult =
  | { status: 'reset'; temporaryPassword: string }
  | { status: 'error'; message: string }

export async function resetPatientPortalPassword(
  username: string  // number-only, e.g. "10047"
): Promise<ResetPasswordResult> {
  const temporaryPassword = generateTemporaryPassword()

  try {
    await client.send(new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: temporaryPassword,
      Permanent: false,
    }))
  } catch (err: unknown) {
    const errorName    = err instanceof Error ? err.name    : 'UnknownError'
    const errorMessage = err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300)
    const meta = (err as { $metadata?: { httpStatusCode?: number; requestId?: string } }).$metadata

    console.error('[cognito-admin] resetPatientPortalPassword failed', {
      username,   // number-only portal username — not a secret
      errorName,
      errorMessage,
      httpStatusCode: meta?.httpStatusCode,
      requestId:      meta?.requestId,
    })

    const message =
      errorName === 'AccessDeniedException'
        ? 'AWS credentials cannot reset password (check cognito-idp:AdminSetUserPassword IAM permission)'
        : errorName === 'InvalidPasswordException'
          ? 'Generated password did not meet Cognito policy'
          : errorName === 'UserNotFoundException'
            ? 'Portal account not found in Cognito'
            : 'Password reset failed — check server logs for details'

    return { status: 'error', message }
  }

  return { status: 'reset', temporaryPassword }
}

export type UnlockAccountResult =
  | { status: 'unlocked' }
  | { status: 'error'; message: string }

export async function unlockPatientPortalAccount(
  username: string  // number-only, e.g. "10047"
): Promise<UnlockAccountResult> {
  try {
    await client.send(new AdminEnableUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    }))
  } catch (err: unknown) {
    const errorName    = err instanceof Error ? err.name    : 'UnknownError'
    const errorMessage = err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300)
    const meta = (err as { $metadata?: { httpStatusCode?: number; requestId?: string } }).$metadata

    console.error('[cognito-admin] unlockPatientPortalAccount failed', {
      username,   // number-only portal username — not a secret
      errorName,
      errorMessage,
      httpStatusCode: meta?.httpStatusCode,
      requestId:      meta?.requestId,
    })

    const message =
      errorName === 'AccessDeniedException'
        ? 'AWS credentials cannot enable user (check cognito-idp:AdminEnableUser IAM permission)'
        : errorName === 'UserNotFoundException'
          ? 'Portal account not found in Cognito'
          : 'Unlock failed — check server logs for details'

    return { status: 'error', message }
  }

  return { status: 'unlocked' }
}

export interface PortalUserSummary {
  username:   string
  msid:       string
  name:       string
  enabled:    boolean
  userStatus: string
  createdAt:  string
}

function cognitoAttr(user: UserType, name: string): string {
  return user.Attributes?.find(a => a.Name === name)?.Value ?? ''
}

export async function listPortalUsers(): Promise<PortalUserSummary[]> {
  const results: PortalUserSummary[] = []
  let paginationToken: string | undefined

  do {
    const resp = await client.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: 60,
      ...(paginationToken && { PaginationToken: paginationToken }),
    }))

    for (const u of resp.Users ?? []) {
      const msid = cognitoAttr(u, 'custom:msid')
      if (!msid) continue
      results.push({
        username:   u.Username ?? '',
        msid,
        name:       cognitoAttr(u, 'name'),
        enabled:    u.Enabled ?? true,
        userStatus: u.UserStatus ?? '',
        createdAt:  u.UserCreateDate?.toISOString().slice(0, 10) ?? '',
      })
    }

    paginationToken = resp.PaginationToken
  } while (paginationToken)

  return results
}
