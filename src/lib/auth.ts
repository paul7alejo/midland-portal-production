import { DEMO_PATIENTS, DEV_ACCOUNT } from "./demoData";
import type { DemoPatient } from "@/types";

// Friendly error messages — plain NZ English
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS:
    "That Midland Sleep ID or email wasn't recognised. Please check and try again.",
  WRONG_PASSWORD:
    "The password doesn't match. Please try again.",
  ACCOUNT_LOCKED:
    "Your account has been temporarily locked. Please try again in 15 minutes.",
  GENERIC:
    "Something went wrong. Please try again shortly.",
} as const;

// Normalise MSID input — strips "MS-" prefix, spaces, and lowercases
// Patients can type "238872", "MS-238872", "ms 238872" — all valid
function normaliseMSID(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/^MS[-\s]?/, "")  // strip optional MS- or MS prefix
    .replace(/\s/g, "");        // strip any internal spaces
}

// Detect whether input is an MSID (6 digits, with or without MS- prefix) or email
export function detectLoginType(input: string): "msid" | "email" {
  const trimmed = input.trim();
  if (trimmed.includes("@")) return "email";

  // Check if it normalises to 6 digits
  const normalised = normaliseMSID(trimmed);
  if (/^\d{6}$/.test(normalised)) return "msid";

  return "email"; // fall through to email path so error message is sensible
}


function findPatient(identifier: string): DemoPatient | undefined {
  const type = detectLoginType(identifier);
  const allAccounts = [...DEMO_PATIENTS, DEV_ACCOUNT];

  if (type === "msid") {
    const inputDigits = normaliseMSID(identifier);
    return allAccounts.find((p) => {
      // Strip MS- from stored MSID too, so comparison is digits-only
      const storedDigits = p.msid.replace(/^MS-/i, "");
      return storedDigits === inputDigits;
    });
  }
  return allAccounts.find(
    (p) => p.email.toLowerCase() === identifier.trim().toLowerCase()
  );
}

// Login — returns patient on success, error message on failure
export async function login(
  identifier: string,
  password: string
): Promise<{ success: true; patient: DemoPatient } | { success: false; error: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const patient = findPatient(identifier);

  if (!patient) {
    return { success: false, error: AUTH_ERRORS.INVALID_CREDENTIALS };
  }

  if (patient.password !== password) {
    return { success: false, error: AUTH_ERRORS.WRONG_PASSWORD };
  }

  // Store session in localStorage (mock Cognito)
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "midland_session",
      JSON.stringify({
        patient_id: patient.id,
        msid: patient.msid,
        name: patient.name,
        logged_in_at: new Date().toISOString(),
      })
    );
  }

  return { success: true, patient };
}

export function getSession(): {
  patient_id: string;
  msid: string;
  name: string;
} | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("midland_session");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getCurrentPatient(): DemoPatient | undefined {
  const session = getSession();
  if (!session) return undefined;
  const allAccounts = [...DEMO_PATIENTS, DEV_ACCOUNT];
  return allAccounts.find((p) => p.id === session.patient_id);
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("midland_session");
  }
}