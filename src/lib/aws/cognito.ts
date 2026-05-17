import { Amplify } from 'aws-amplify'
import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
  confirmSignIn,
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

function normalizeUsername(input: string): string {
  const raw = input.trim()
  if (raw.includes('@')) return raw
  if (/^\d+$/.test(raw) || /^ms-?\d/i.test(raw)) return raw.replace(/\D/g, '')
  return raw
}

export type SignInResult =
  | { success: true; userId: string }
  | { success: false; error: string; nextStep?: 'new_password_required' }

export async function signIn(username: string, password: string): Promise<SignInResult> {
  try {
    const normalized = normalizeUsername(username)
    const result = await amplifySignIn({ username: normalized, password })
    if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      return { success: false, error: 'new_password_required', nextStep: 'new_password_required' }
    }
    if (!result.isSignedIn) {
      return { success: false, error: 'Sign-in requires an additional step' }
    }
    const user = await amplifyGetCurrentUser()
    return { success: true, userId: user.userId }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Sign-in failed' }
  }
}

export async function completeNewPassword(newPassword: string): Promise<SignInResult> {
  try {
    const result = await confirmSignIn({ challengeResponse: newPassword })
    if (result.isSignedIn) {
      const user = await amplifyGetCurrentUser()
      return { success: true, userId: user.userId }
    }
    return { success: false, error: 'Password change did not complete sign-in. Please try again.' }
  } catch (err) {
    const name = err instanceof Error ? (err as { name?: string }).name : ''
    if (name === 'InvalidPasswordException') {
      return { success: false, error: 'Password does not meet the required policy. Use at least 8 characters with a mix of letters, numbers, and symbols.' }
    }
    if (name === 'NotAuthorizedException') {
      return { success: false, error: 'Your temporary password has expired. Please contact Midland Sleep for a new one.' }
    }
    if (name === 'LimitExceededException') {
      return { success: false, error: 'Too many attempts. Please wait a moment and try signing in again.' }
    }
    return { success: false, error: err instanceof Error ? err.message : 'Password change failed. Please try again.' }
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
  role: string | undefined
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
      name: attrs['name'] ?? attrs['custom:name'],
      email: attrs.email,
      role: attrs['custom:role'],
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
