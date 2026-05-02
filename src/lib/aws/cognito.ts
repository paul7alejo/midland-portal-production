import { Amplify } from 'aws-amplify'
import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
} from 'aws-amplify/auth'

export function configureCognito(): void {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      },
    },
  })
}

// Strip everything non-digit: handles "MS-238872", "ms 238872", "238872"
function normalizeMSID(input: string): string {
  return input.replace(/\D/g, '')
}

export type SignInResult =
  | { success: true; userId: string }
  | { success: false; error: string }

export async function signIn(username: string, password: string): Promise<SignInResult> {
  try {
    const result = await amplifySignIn({ username: normalizeMSID(username), password })
    if (!result.isSignedIn) {
      return { success: false, error: 'Sign-in requires an additional step' }
    }
    const user = await amplifyGetCurrentUser()
    return { success: true, userId: user.userId }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Sign-in failed' }
  }
}

export async function signOut(): Promise<void> {
  await amplifySignOut()
}

export interface PatientUser {
  userId: string
  username: string
  msid: string | undefined
  orgId: string | undefined
  name: string | undefined
  email: string | undefined
}

export async function getCurrentUser(): Promise<PatientUser | null> {
  try {
    const [user, attrs] = await Promise.all([
      amplifyGetCurrentUser(),
      fetchUserAttributes(),
    ])
    return {
      userId: user.userId,
      username: user.username,
      msid: attrs['custom:msid'],
      orgId: attrs['custom:org_id'],
      name: attrs['custom:name'],
      email: attrs.email,
    }
  } catch {
    return null
  }
}

export async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString() ?? null
  } catch {
    return null
  }
}
