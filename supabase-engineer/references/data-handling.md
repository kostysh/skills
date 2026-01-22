# Data Handling (PII, Retention, Redaction)

## Data classification
| Category | Examples | Handling |
| --- | --- | --- |
| PII | Email, name, phone | Minimize, encrypt, restrict access |
| Sensitive | API keys, tokens | Never log, rotate regularly |
| Business | Usage metrics | Aggregate when possible |
| Public | Product names | Standard handling |

## PII detection
```ts
const PII_PATTERNS = [
  { type: "email", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { type: "phone", regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g },
  { type: "ssn", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: "credit_card", regex: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g },
];

function detectPII(text: string) {
  return PII_PATTERNS.flatMap((p) =>
    [...text.matchAll(p.regex)].map((m) => ({ type: p.type, match: m[0] }))
  );
}
```

## Redaction
```ts
const SENSITIVE_KEYS = ["email", "phone", "ssn", "password", "apiKey"];

function redact<T extends Record<string, any>>(data: T): T {
  const result = { ...data };
  for (const key of SENSITIVE_KEYS) {
    if (key in result) result[key] = "[REDACTED]";
  }
  return result;
}
```

## Retention rules
- Define TTL for logs and exports.
- Provide a user data export + delete path (GDPR/CCPA).
- Keep audit trails minimal and access-controlled.
