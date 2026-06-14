import { NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { appendAuditLog } from "@/lib/aws/dynamodb";

const region =
  process.env.NEXT_PUBLIC_COGNITO_REGION ??
  process.env.DYNAMODB_REGION ??
  "ap-southeast-2";

const cognitoClient = new CognitoIdentityProviderClient({ region });

// Always return this — never reveal whether an account exists.
const GENERIC_OK = { ok: true } as const;

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await req.json().catch(() => ({}));
    const email    = typeof body?.email    === "string" ? body.email.trim()  : "";
    const userType = body?.userType === "staff" ? "staff" : "patient";

    if (email) {
      const clientId =
        userType === "staff"
          ? (process.env.NEXT_PUBLIC_COGNITO_STAFF_CLIENT_ID ??
             process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!)
          : process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;

      // Initiate Cognito password reset — errors absorbed to prevent account enumeration.
      try {
        await cognitoClient.send(
          new ForgotPasswordCommand({ ClientId: clientId, Username: email })
        );
      } catch {
        // Never expose Cognito errors or confirm account existence
      }

      // Safe audit — no email, no token, no reset code
      const action =
        userType === "staff"
          ? "staff_password_reset_requested"
          : "patient_password_reset_requested";
      try {
        await appendAuditLog({
          userId:     "SYSTEM",
          event_type: action,
          action,
          org_id:     "midland-sleep",
          timestamp:  new Date().toISOString(),
          result:     "requested",
        });
      } catch {
        // Audit failure must not affect the response
      }
    }

    return NextResponse.json(GENERIC_OK);
  } catch {
    return NextResponse.json(GENERIC_OK);
  }
}
