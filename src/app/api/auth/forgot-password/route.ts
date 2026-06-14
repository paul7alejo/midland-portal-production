import { NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const region =
  process.env.NEXT_PUBLIC_COGNITO_REGION ??
  process.env.DYNAMODB_REGION ??
  "ap-southeast-2";

const cognitoClient = new CognitoIdentityProviderClient({ region });

// Always return this — never reveal whether an account exists.
const GENERIC_OK = { ok: true } as const;

// Resolve an email address to the Cognito Username for the given pool.
// Returns null on any error or if no user is found — caller absorbs silently.
// Requires cognito-idp:ListUsers on the user pool.
async function resolveUsername(email: string, userPoolId: string): Promise<string | null> {
  // Sanitize: reject anything with characters outside a valid email set
  if (!/^[a-zA-Z0-9._%+\-@]+$/.test(email)) return null;
  try {
    const result = await cognitoClient.send(new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter:     `email = "${email}"`,
      Limit:      1,
    }));
    return result.Users?.[0]?.Username ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await req.json().catch(() => ({}));
    const email    = typeof body?.email    === "string" ? body.email.trim()  : "";
    const userType = body?.userType === "staff" ? "staff" : "patient";

    if (email) {
      const patientPoolId = process.env.COGNITO_PATIENT_USER_POOL_ID ??
                            process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;
      const staffPoolId   = process.env.NEXT_PUBLIC_COGNITO_STAFF_POOL_ID ?? patientPoolId;
      const poolId        = userType === "staff" ? staffPoolId : patientPoolId;
      const clientId      = userType === "staff"
        ? (process.env.NEXT_PUBLIC_COGNITO_STAFF_CLIENT_ID ??
           process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!)
        : process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;

      // Resolve email → Cognito username (patient accounts use numeric MSID as username).
      // Falls back to email if resolution fails — Cognito will reject if not found, which is absorbed.
      const username = (await resolveUsername(email, poolId)) ?? email;

      // Initiate Cognito password reset — errors absorbed to prevent account enumeration.
      try {
        await cognitoClient.send(
          new ForgotPasswordCommand({ ClientId: clientId, Username: username })
        );
      } catch {
        // Never expose Cognito errors or confirm account existence
      }

    }

    return NextResponse.json(GENERIC_OK);
  } catch {
    return NextResponse.json(GENERIC_OK);
  }
}
