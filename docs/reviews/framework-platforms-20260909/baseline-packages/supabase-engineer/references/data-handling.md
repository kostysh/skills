# Data Handling (PII, Retention, Redaction)

## Data classification
| Category | Examples | Handling |
| --- | --- | --- |
| PII | Email, name, phone | Minimize, encrypt, restrict access |
| Sensitive | API keys, tokens | Never log, rotate regularly |
| Business | Usage metrics | Aggregate when possible |
| Public | Product names | Standard handling |

## Discovery and classification

- Inventory fields, free text, files, logs, backups, exports, Realtime payloads, and third-party transfers.
- Trace collection purpose, source, access roles, storage location, retention, deletion/export behavior, and telemetry exposure.
- Regexes and key-name allowlists can be local detection aids, but they are incomplete and cannot establish privacy coverage or legal compliance.

## Redaction

- Prefer allowlisted structured logging over recursive denylist redaction.
- Test with sentinel secrets and personal-data values across success and error paths.
- Never log tokens, API keys, raw Auth payloads, signed URLs, or unrestricted query results.

## Retention rules
- Define TTL for logs and exports.
- Implement accepted export and deletion requirements across application tables, `auth.users`, Storage, backups, and downstream processors.
- Keep audit trails minimal and access-controlled.
- Route legal basis, rights, retention, and compliance verdicts to `gdpr-compliance`; this skill owns Supabase implementation controls, not legal conclusions.
