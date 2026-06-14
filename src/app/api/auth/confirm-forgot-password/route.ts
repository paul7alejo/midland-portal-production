import { NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const region =
  process.env.NEXT_PUBLIC_COGNITO_REGION ??
  process.env.DYNAMODB_REGION ??
  "ap-southeast-2";

const cognitoClient = new CognitoIdentityProviderClient({ region });

// Resolve an email address to the Cognito Username for the given pool.
// Requires cognito-idp:ListUsers on the user pool.
async function resolveUsername(email: string, userPoolId: string): Promise<string | null> {
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
    const email       = typeof body?.email       === "string" ? body.email.trim()    : "";
    const code        = typeof body?.code        === "string" ? body.code.trim()     : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword     : "";
    const userType    = body?.userType === "staff" ? "staff" : "patient";

    if (!email || !code || !newPassword) {
      return NextResponse.json({ ok: false });
    }

    const patientPoolId = process.env.COGNITO_PATIENT_USER_POOL_ID ??
                          process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;
    const staffPoolId   = process.env.NEXT_PUBLIC_COGNITO_STAFF_POOL_ID ?? patientPoolId;
    const poolId        = userType === "staff" ? staffPoolId : patientPoolId;
    const clientId      = userType === "staff"
      ? (process.env.NEXT_PUBLIC_COGNITO_STAFF_CLIENT_ID ??
         process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!)
      : process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;

    // Resolve email → Cognito username before confirming reset.
    const username = (await resolveUsername(email, poolId)) ?? email;

    try {
      await cognitoClient.send(new ConfirmForgotPasswordCommand({
        ClientId:         clientId,
        Username:         username,
        ConfirmationCode: code,
        Password:         newPassword,
      }));
    } catch {
      // Never expose Cognito error details — return generic failure
      return NextResponse.json({ ok: false });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
