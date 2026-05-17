import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { randomBytes } from 'crypto'

const region = process.env.DYNAMODB_REGION ?? process.env.AWS_REGION ?? 'ap-southeast-2'

const USER_POOL_ID = process.env.COGNITO_PATIENT_USER_POOL_ID!

const client = new CognitoIdentityProviderClient({ region })

export type PortalUserResult =
  | { status: 'created'; temporaryPassword: string }
  | { status: 'already_exists' }
  | { status: 'msid_conflict' }
  | { status: 'error'; message: string }

function generateTemporaryPassword(): string {
  // "Midland!" prefix satisfies: uppercase (M), lowercase (idland), special (!)
  // 8-char suffix from readable charset; one digit guaranteed for Cognito policy
  const upper  = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const lower  = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const all    = upper + lower + digits

  const bytes = randomBytes(10)
  const suffix: string[] = Array.from({ length: 8 }, (_, i) => all[bytes[i] % all.length])
  const digitPos = bytes[8] % 8
  suffix[digitPos] = digits[bytes[9] % digits.length]

  return 'Midland!' + suffix.join('')
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

  try {
    await client.send(new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      TemporaryPassword: temporaryPassword,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'custom:msid',   Value: msid },
        { Name: 'custom:org_id', Value: orgId },
        { Name: 'email',         Value: email },
        { Name: 'name',          Value: name },
      ],
    }))
    return { status: 'created', temporaryPassword }
  } catch (err: unknown) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to create portal user',
    }
  }
}
