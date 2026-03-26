# Complete SDD Workflow Example

This example demonstrates a full SDD workflow for implementing user authentication.

---

## Scenario

**Ticket**: AUTH-123
**Feature**: User login with email and password

---

## Phase 1: Requirements

### User Prompt
```
/sdd-req Add user login functionality with email and password
```

### Agent Actions
1. Creates `docs/sdd/AUTH-123/` directory
2. Asks clarifying questions
3. Drafts requirements
4. Reviews with user

### Resulting Artifact: `docs/sdd/AUTH-123/R1-requirements.md`

```markdown
# Requirements: User Login

**Ticket**: AUTH-123
**Author**: AI Agent
**Date**: 2025-01-15
**Status**: Approved

## Overview

Users need to authenticate to access protected features. This requirement covers
the basic email/password login flow.

## User Stories

### US-1: User Login

**As a** registered user
**I want** to log in with my email and password
**So that** I can access my account and protected features

#### Acceptance Criteria

**AC-1.1**: Successful login with valid credentials
- **Given** a registered user with email "user@example.com" and password "SecurePass123"
- **When** they submit the login form with correct credentials
- **Then** they are redirected to the dashboard
- **And** they receive a valid session token

**AC-1.2**: Failed login with invalid password
- **Given** a registered user with email "user@example.com"
- **When** they submit the login form with incorrect password
- **Then** they see an error message "Invalid email or password"
- **And** they remain on the login page

**AC-1.3**: Failed login with non-existent email
- **Given** no user exists with email "unknown@example.com"
- **When** someone submits the login form with that email
- **Then** they see an error message "Invalid email or password"
- **And** the response time is similar to valid email check (prevent enumeration)

**AC-1.4**: Account lockout after failed attempts
- **Given** a user has failed login 5 times in 15 minutes
- **When** they attempt to login again
- **Then** they see "Account temporarily locked. Try again in 15 minutes."
- **And** the account is locked regardless of correct password

## Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-1 | Email with leading/trailing spaces | Trim and process normally |
| EC-2 | Case variation in email | Treat as case-insensitive |
| EC-3 | Empty email or password | Show validation error |
| EC-4 | SQL injection in email field | Sanitize, show validation error |

## Non-Functional Requirements

### Performance
- NFR-P1: Login response time < 500ms at p95

### Security
- NFR-S1: Passwords never logged or returned in responses
- NFR-S2: Failed attempts logged with IP address
- NFR-S3: Session tokens expire after 24 hours of inactivity

## Out of Scope

- Password reset functionality (separate ticket)
- Social login (OAuth) (separate ticket)
- Multi-factor authentication (separate ticket)
- Remember me functionality (separate ticket)

## Assumptions

- User registration already exists
- Email format validation exists
- Database has users table with email and password_hash columns
```

---

## Phase 2: Specification

### User Prompt
```
/sdd-spec
```

### Agent Actions
1. Reads R1-requirements.md
2. Investigates codebase
3. Designs technical solution
4. Presents to user for approval

### Resulting Artifact: `docs/sdd/AUTH-123/S1-specification.md`

```markdown
# Technical Specification: User Login

**Ticket**: AUTH-123
**Author**: AI Agent
**Date**: 2025-01-15
**Status**: Approved

**Requirements Reference**: `docs/sdd/AUTH-123/R1-requirements.md`

## Problem Statement

Users currently cannot authenticate. We need a secure login endpoint that
validates credentials, issues session tokens, and handles security concerns
like brute force protection.

## Proposed Solution

Implement a REST API endpoint for authentication with:
- Email/password validation against database
- JWT token generation for sessions
- Rate limiting per IP and per email
- Consistent timing to prevent enumeration

## Requirements Coverage

| Requirement | Solution |
|-------------|----------|
| US-1 | POST /api/auth/login endpoint |
| AC-1.1 | Return JWT token on success |
| AC-1.2 | Return 401 with generic message |
| AC-1.3 | Same response as AC-1.2 (prevents enumeration) |
| AC-1.4 | Redis-based attempt tracking |
| NFR-P1 | Indexed email column, connection pooling |
| NFR-S1 | Password excluded from logs and responses |

## Affected Components

| Component | Path | Change Type | Description |
|-----------|------|-------------|-------------|
| AuthController | `src/controllers/auth.controller.ts` | new | Login endpoint handler |
| AuthService | `src/services/auth.service.ts` | new | Authentication logic |
| RateLimiter | `src/middleware/rate-limiter.ts` | modify | Add per-email limiting |
| User model | `src/models/user.model.ts` | modify | Add failedAttempts field |

## API Contract

### POST /api/auth/login

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Invalid email or password"
}
```

**Response (429 Too Many Requests)**:
```json
{
  "error": "Account temporarily locked. Try again in 15 minutes."
}
```

## Data Model Changes

```typescript
// Add to User model
interface User {
  // existing fields...
  failedLoginAttempts: number;
  lockoutUntil: Date | null;
}
```

## Error Handling

| Error | Code | Message | HTTP |
|-------|------|---------|------|
| Invalid credentials | AUTH_INVALID | "Invalid email or password" | 401 |
| Account locked | AUTH_LOCKED | "Account temporarily locked..." | 429 |
| Validation error | VALIDATION | Field-specific messages | 400 |

## Security Considerations

1. **Password comparison**: Use constant-time comparison to prevent timing attacks
2. **Token security**: JWT signed with RS256, stored in httpOnly cookie
3. **Enumeration prevention**: Same response time for valid/invalid emails
4. **Logging**: Log attempts without passwords, include IP address
5. **Rate limiting**: 10 requests/minute per IP, 5 attempts per email

## Testing Strategy

- Unit tests: AuthService methods
- Integration tests: POST /api/auth/login endpoint
- Security tests: SQL injection, timing attack verification
```

---

## Phase 3: Planning

### User Prompt
```
/sdd-plan
```

### Resulting Artifact: `docs/sdd/AUTH-123/P1-plan.md`

```markdown
# Implementation Plan: User Login

**Ticket**: AUTH-123
**Author**: AI Agent
**Date**: 2025-01-15
**Status**: Approved

**Specification Reference**: `docs/sdd/AUTH-123/S1-specification.md`

## Prerequisites

**Required Skills**: code-style, testing

**Pre-conditions**:
- [ ] Database running locally
- [ ] Redis running (for rate limiting)
- [ ] All existing tests passing

## Context

### Current State
- User model exists with email and password_hash fields
- No authentication endpoints exist
- Rate limiter middleware exists but only limits by IP

### Target State
- POST /api/auth/login endpoint authenticates users
- Failed attempts are tracked and accounts lock after 5 failures
- Rate limiting applies per IP and per email

### Key Files
| File | Purpose |
|------|---------|
| `src/models/user.model.ts` | User data model |
| `src/middleware/rate-limiter.ts` | Request rate limiting |

## Implementation Steps

### Step 1: Write Unit Tests for AuthService

Write tests (fail first if TDD requested) for the authentication service.

**Files**:
- `tests/unit/services/auth.service.test.ts`

**Tests to write**:
- `login()` returns user and token for valid credentials
- `login()` throws AuthError for invalid password
- `login()` throws AuthError for non-existent email
- `login()` throws AuthError when account is locked
- `login()` increments failedAttempts on failure
- `login()` resets failedAttempts on success

**Verification**:
- Tests exist and fail with "AuthService not found" or similar
- Run: `npm test -- auth.service`

---

### Step 2: Implement AuthService

Create the authentication service with login logic.

**Files**:
- `src/services/auth.service.ts`

**Implementation**:
- Create AuthService class
- Implement login() method
- Use bcrypt for password comparison
- Generate JWT token
- Track failed attempts
- Implement lockout logic

**Verification**:
- All unit tests from Step 1 pass
- Run: `npm test -- auth.service`

---

### Step 3: Write Integration Tests for Login Endpoint

Write tests (fail first if TDD requested) for the API endpoint.

**Files**:
- `tests/integration/api/auth.api.test.ts`

**Tests to write**:
- POST /api/auth/login returns 200 with token for valid credentials
- POST /api/auth/login returns 401 for invalid password
- POST /api/auth/login returns 401 for non-existent email
- POST /api/auth/login returns 429 when account locked
- POST /api/auth/login returns 400 for missing fields

**Verification**:
- Tests exist and fail with "Route not found" or similar
- Run: `npm test -- auth.api`

---

### Step 4: Implement AuthController and Route

Create the login endpoint.

**Files**:
- `src/controllers/auth.controller.ts`
- `src/routes/auth.routes.ts`
- `src/routes/index.ts` (add auth routes)

**Implementation**:
- Create AuthController with login handler
- Validate request body
- Call AuthService.login()
- Return appropriate responses
- Register route in router

**Verification**:
- All integration tests pass
- Run: `npm test -- auth.api`

---

### Step 5: Update Rate Limiter for Per-Email Limiting

Enhance rate limiter to track by email.

**Files**:
- `src/middleware/rate-limiter.ts`
- `tests/unit/middleware/rate-limiter.test.ts`

**Implementation**:
- Add email-based rate limiting
- Configure 5 attempts per email per 15 minutes
- Integrate with Redis

**Verification**:
- Rate limiter tests pass
- Manual test: 6th login attempt with same email returns 429

---

### Step 6: Add User Model Fields

Add failedLoginAttempts and lockoutUntil to User model.

**Files**:
- `src/models/user.model.ts`
- `migrations/YYYYMMDD-add-login-tracking.ts`

**Implementation**:
- Add fields to model interface
- Create migration for new columns
- Run migration

**Verification**:
- Migration completes successfully
- Model reflects new fields

---

### Step 7: Write Handover Document

Write a handover document containing:
1. List of all files created/modified
2. Summary of changes made
3. Any issues encountered
4. Notes for future reference

Write to `docs/sdd/AUTH-123/P1-plan.summary.md`

---

**Important**: Do not trust this plan blindly. Verify your understanding of the codebase before applying changes.

**External Tools**: Do NOT use web search, documentation fetching, or external APIs during implementation unless explicitly allowed in this plan.
```

---

## Phase 4: Tasks

### User Prompt
```
/sdd-tasks
```

### Resulting Artifact: `docs/sdd/AUTH-123/T1-tasks.md`

```markdown
# Tasks: User Login

**Ticket**: AUTH-123
**Plan Reference**: `docs/sdd/AUTH-123/P1-plan.md`

## Task Overview

| ID | Task | Status | Deps | Parallel | Effort |
|----|------|--------|------|----------|--------|
| T1 | Write AuthService unit tests | pending | - | yes | medium |
| T2 | Write login API integration tests | pending | - | yes | medium |
| T3 | Implement AuthService | pending | T1 | no | medium |
| T4 | Implement AuthController and route | pending | T2,T3 | no | medium |
| T5 | Update rate limiter | pending | - | yes | small |
| T6 | Add User model fields | pending | - | yes | small |
| T7 | Final integration testing | pending | T4,T5,T6 | no | small |

## Parallel Execution Groups

**Group 1** (can start immediately):
- T1, T2, T5, T6

**Group 2** (after T1):
- T3

**Group 3** (after T2, T3):
- T4

**Group 4** (after T4, T5, T6):
- T7

## Task Details

### T1: Write AuthService unit tests

**Files**: `tests/unit/services/auth.service.test.ts`

**Verification**:
- [ ] 6 test cases written
- [ ] Tests fail with expected errors
- [ ] `npm test -- auth.service` runs

---

### T2: Write login API integration tests

**Files**: `tests/integration/api/auth.api.test.ts`

**Verification**:
- [ ] 5 test cases written
- [ ] Tests fail with "Route not found"
- [ ] `npm test -- auth.api` runs

---

### T3: Implement AuthService

**Dependencies**: T1
**Files**: `src/services/auth.service.ts`

**Verification**:
- [ ] AuthService class created
- [ ] login() method implemented
- [ ] All T1 tests pass

---

### T4: Implement AuthController and route

**Dependencies**: T2, T3
**Files**:
- `src/controllers/auth.controller.ts`
- `src/routes/auth.routes.ts`
- `src/routes/index.ts`

**Verification**:
- [ ] Endpoint responds to POST /api/auth/login
- [ ] All T2 tests pass

---

### T5: Update rate limiter

**Files**:
- `src/middleware/rate-limiter.ts`
- `tests/unit/middleware/rate-limiter.test.ts`

**Verification**:
- [ ] Per-email limiting works
- [ ] Rate limiter tests pass

---

### T6: Add User model fields

**Files**:
- `src/models/user.model.ts`
- `migrations/YYYYMMDD-add-login-tracking.ts`

**Verification**:
- [ ] Migration runs successfully
- [ ] Model has new fields

---

### T7: Final integration testing

**Dependencies**: T4, T5, T6
**Files**: None (testing only)

**Verification**:
- [ ] All tests pass
- [ ] Manual login test works
- [ ] Rate limiting verified manually
```

---

## Phase 5: Implementation

### User Prompt
```
/sdd-impl
```

### If TDD is requested, agent uses RED/GREEN/VERIFY

### Resulting Artifacts
- Code changes in src/ and tests/
- `docs/sdd/AUTH-123/P1-plan.summary.md`

---

## Phase 6: Validation

### User Prompt
```
/sdd-validate
```

### Resulting Artifacts
- `docs/sdd/AUTH-123/V1-validation.md`
- `docs/sdd/AUTH-123/H1-handover.md`

---

## Final Directory Structure

```
docs/sdd/
└── AUTH-123/
    ├── R1-requirements.md      # Requirements
    ├── S1-specification.md     # Technical spec
    ├── P1-plan.md              # Implementation plan
    ├── P1-plan.summary.md      # Plan execution summary
    ├── T1-tasks.md             # Task breakdown
    ├── V1-validation.md        # Validation report
    └── H1-handover.md          # Final handover
```

---

## Key Takeaways

1. **Each phase builds on the previous** - Requirements → Spec → Plan → Tasks
2. **Human approval at each transition** - Never auto-proceed
3. **Tests come first** - T1 and T2 written before T3 and T4
4. **Traceability throughout** - Every artifact references its predecessors
5. **Validation confirms completeness** - Coverage matrix proves requirements met
