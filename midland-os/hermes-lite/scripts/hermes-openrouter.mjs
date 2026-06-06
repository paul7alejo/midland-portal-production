#!/usr/bin/env node

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/free";

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", chunk => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data.trim()));
    process.stdin.on("error", reject);
  });
}

function redactSensitiveText(input) {
  return input
    // AWS access key IDs
    .replace(/AKIA[0-9A-Z]{16}/g, "[REDACTED_AWS_ACCESS_KEY_ID]")
    .replace(/ASIA[0-9A-Z]{16}/g, "[REDACTED_AWS_SESSION_KEY_ID]")

    // Emails
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")

    // NZ-ish phone / generic phone-like values
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[REDACTED_PHONE_OR_LONG_NUMBER]")

    // NHI-like values: 3 letters + 4 digits
    .replace(/\b[A-Z]{3}\d{4}\b/gi, "[REDACTED_NHI_LIKE_VALUE]")

    // Bearer/API/token-looking values
    .replace(/\b(?:sk|pk|rk|or)-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED_TOKEN]")
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[REDACTED_LONG_ID_OR_SECRET]");
}

function buildPrompt(redactedNotes) {
  return `You are Hermes, a strict AI-native delivery assistant for OneOfZero Systems.

Convert the user's messy notes into a structured Hermes task brief.

Rules:
- Do not invent patient data, secrets, AWS details, or clinical facts.
- Do not recommend broad refactors.
- Prefer surgical scope.
- Keep healthcare-adjacent data safety strict.
- If the notes are vague, write safe placeholders instead of guessing.
- Output markdown only.
- Include a warning that the output must be reviewed before use.

Required structure:

# Hermes Task Brief Draft

## Review Warning
This AI-generated brief must be reviewed before use. Do not paste secrets, patient data, raw NHI, emails, phone numbers, addresses, Cognito identifiers, AWS keys, or audit payloads into agents.

## Objective

## Context

## Business Value

## User / Admin Outcome

## Risk Level
LOW / MEDIUM / HIGH

## Allowed Files

## Forbidden Files

## Requirements

## Edge Cases

## Acceptance Criteria

## Verification
- npx tsc --noEmit
- npm run build

## Out of Scope

## Safety Notes

Messy notes:
${redactedNotes}
`;
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    console.error("Missing OPENROUTER_API_KEY. Set it in your terminal session only. Do not save it to .env, Git, Obsidian, or screenshots.");
    process.exit(1);
  }

  const rawInput = await readStdin();

  if (!rawInput) {
    console.error("No input received. Pipe messy notes into this script.");
    process.exit(1);
  }

  const redactedInput = redactSensitiveText(rawInput);

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://oneofzero.systems",
      "X-OpenRouter-Title": "OneOfZero Hermes Lite"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You create structured, safe software task briefs. You do not write code. You do not request or expose sensitive data."
        },
        {
          role: "user",
          content: buildPrompt(redactedInput)
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`OpenRouter request failed: ${response.status} ${response.statusText}`);
    console.error(body.slice(0, 1000));
    process.exit(1);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;

  if (!content) {
    console.error("OpenRouter response did not include message content.");
    process.exit(1);
  }

  console.log(content.trim());
}

main().catch(error => {
  console.error("Hermes OpenRouter helper failed safely.");
  console.error(error?.message || String(error));
  process.exit(1);
});
