# SDD Anti-Patterns

## Specification Anti-Patterns

### Vague Requirements

**Anti-pattern**: Using unmeasurable or subjective criteria.

```markdown
❌ "The system should be fast"
❌ "The UI should be user-friendly"
❌ "The API should handle high load"

✓ "API response time < 200ms at p95 under normal load"
✓ "Users can complete checkout in 3 steps or fewer"
✓ "System supports 10,000 concurrent connections"
```

**Why it's bad**: Vague requirements can't be verified. "Fast" to you might be slow to someone else.

### Missing Edge Cases

**Anti-pattern**: Only specifying the happy path.

```markdown
❌ "User can log in with email and password"

✓ "User can log in with email and password"
  - AC: Invalid email format → show validation error
  - AC: Incorrect password → show "Invalid credentials"
  - AC: Account locked → show "Account locked, contact support"
  - AC: 5 failed attempts → lock account for 15 minutes
```

**Why it's bad**: Edge cases are where bugs hide. If not specified, agents will guess (often wrong).

### Implementation Details in Requirements

**Anti-pattern**: Mixing HOW with WHAT.

```markdown
❌ "Use JWT with RS256 for authentication tokens stored in HttpOnly cookies"

✓ "System authenticates users securely"
  - Tokens must be tamper-proof
  - Tokens must not be accessible to JavaScript
  - Sessions expire after 24 hours of inactivity
```

**Why it's bad**: Requirements should be stable. Implementation details change. Mixing them causes unnecessary churn.

### Assumed Requirements

**Anti-pattern**: Filling in gaps without asking.

```markdown
❌ Agent assumes: "Users probably want email notifications"
❌ Agent assumes: "We should add pagination to all lists"
❌ Agent assumes: "Soft delete is better than hard delete"

✓ Agent asks: "Should users receive email notifications for X?"
✓ Agent asks: "Should lists be paginated? If so, what page size?"
✓ Agent asks: "Should deleted records be soft-deleted or permanently removed?"
```

**Why it's bad**: Assumptions create work that may need to be undone. Better to ask upfront.

### Compound User Stories

**Anti-pattern**: Stories that do too many things.

```markdown
❌ "As a user, I want to manage my account, including profile updates,
   password changes, notification preferences, and account deletion"

✓ US-1: "As a user, I want to update my profile information"
✓ US-2: "As a user, I want to change my password"
✓ US-3: "As a user, I want to configure notification preferences"
✓ US-4: "As a user, I want to delete my account"
```

**Why it's bad**: Compound stories are hard to estimate, test, and track. Split them.

## Planning Anti-Patterns

### Monolithic Plans

**Anti-pattern**: Single plans with too many steps.

```markdown
❌ Plan with 25 steps covering entire feature

✓ Main plan coordinating:
  - API plan (8 steps)
  - UI plan (7 steps)
  - Integration plan (5 steps)
```

**Why it's bad**: Long plans lose context. Agents can't hold 25 steps in working memory effectively.

### Hidden Dependencies

**Anti-pattern**: Not making dependencies explicit.

```markdown
❌ Step 3: "Create user service"
   Step 4: "Create user controller"
   (No mention that controller depends on service)

✓ Step 3: "Create user service"
   Step 4: "Create user controller"
   - Dependencies: Step 3 (uses UserService)
```

**Why it's bad**: Without explicit dependencies, agents may execute in wrong order.

### No Rollback Strategy

**Anti-pattern**: Not planning for failure.

```markdown
❌ "Run database migration"

✓ "Run database migration"
   - Backup: Snapshot before migration
   - Rollback: Migration has down() method
   - Verification: Check row counts after migration
```

**Why it's bad**: Things go wrong. Without rollback plans, failures become crises.

### Ignoring Existing Patterns

**Anti-pattern**: Creating new patterns when codebase has established ones.

```markdown
❌ "Create new validation utility"
   (When codebase already has validation patterns)

✓ "Use existing ValidationService pattern"
   - Reference: src/services/validation.ts
   - Follow: Same error format as existing validators
```

**Why it's bad**: Inconsistency makes codebase harder to maintain.

## Implementation Anti-Patterns

### Skipping Tests or Ignoring the Plan

**Anti-pattern**: Implementing without the tests defined in the plan.

```markdown
❌ Step 1: Implement feature
   Step 2: Maybe write tests later

✓ Step 1: Follow the plan's testing steps
   Step 2: Implement and verify
```

**Why it's bad**: Missing or delayed tests reduce confidence and break traceability. If TDD is explicitly requested, writing tests after implementation is also a violation.

### Scope Creep

**Anti-pattern**: Adding features not in requirements.

```markdown
❌ "While implementing login, I also added:
   - Password strength meter
   - Remember me checkbox
   - Social login buttons"
   (None of these were in requirements)

✓ Implement exactly what's specified
   Note: "Social login could be valuable - suggest for future story"
```

**Why it's bad**: Unauthorized features may not be wanted, tested, or documented.

### Silent Failures

**Anti-pattern**: Catching errors without handling them.

```javascript
// ❌ Anti-pattern
try {
  await saveUser(user);
} catch (e) {
  // Silently swallowed
}

// ✓ Correct
try {
  await saveUser(user);
} catch (e) {
  logger.error('Failed to save user', { userId: user.id, error: e });
  throw new UserSaveError('Could not save user', { cause: e });
}
```

**Why it's bad**: Silent failures are debugging nightmares.

### Copy-Paste Coding

**Anti-pattern**: Copying code without understanding security implications.

```markdown
❌ Copy authentication code from Stack Overflow without review

✓ Understand each line before using
✓ Check for security vulnerabilities
✓ Adapt to project's patterns and requirements
```

**Why it's bad**: Copied code often has vulnerabilities or doesn't fit the context.

## AI Agent-Specific Anti-Patterns

### Hallucinated Dependencies

**Anti-pattern**: Importing packages that don't exist.

```javascript
// ❌ Agent imports non-existent package
import { validateEmail } from 'email-validator-pro';  // Doesn't exist

// ✓ Use actual project dependencies or built-in functions
import { validate } from './utils/validation';  // Project utility
```

**Prevention**: Verify all imports against package.json before using.

### Invented APIs

**Anti-pattern**: Calling API methods that don't exist.

```javascript
// ❌ Agent invents method
const user = await db.users.findByEmail(email);  // Method doesn't exist

// ✓ Check actual available methods
const user = await db.users.findOne({ where: { email } });  // Actual API
```

**Prevention**: Read actual source files to verify API signatures.

### N+1 Queries

**Anti-pattern**: Database query in a loop.

```javascript
// ❌ N+1 anti-pattern
const users = await getUsers();
for (const user of users) {
  user.orders = await getOrders(user.id);  // Query per user!
}

// ✓ Single query with join or batch
const users = await getUsersWithOrders();  // Single query
```

**Prevention**: Flag any database call inside a loop.

### Security Vulnerabilities

Common AI-generated security issues:

```javascript
// ❌ SQL Injection
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ❌ XSS
element.innerHTML = userInput;

// ❌ Command Injection
exec(`process ${userInput}`);

// ✓ Use parameterized queries
// ✓ Use textContent or sanitize HTML
// ✓ Validate and sanitize all inputs
```

**Prevention**: Security review all generated code.

### Ignoring Error Returns

**Anti-pattern**: Not checking operation results.

```javascript
// ❌ Ignoring potential failure
await file.write(data);
// Continues assuming success

// ✓ Verify success
const result = await file.write(data);
if (!result.success) {
  throw new WriteError(`Failed to write: ${result.error}`);
}
```

**Prevention**: Every operation can fail—check returns.

## Process Anti-Patterns

### Skipping Phases

**Anti-pattern**: Jumping straight to implementation.

```markdown
❌ User: "Add authentication"
   Agent: Immediately starts coding

✓ User: "Add authentication"
   Agent: "Let me first capture requirements..."
```

**Why it's bad**: Without requirements, you can't verify correctness.

### Phase Blending

**Anti-pattern**: Mixing phases together.

```markdown
❌ Writing specification while implementing
   (Spec keeps changing based on implementation discoveries)

✓ Complete specification first
   Get approval
   Then implement
   (If implementation reveals issues, pause and update spec)
```

**Why it's bad**: Phase blending leads to drift and lost traceability.

### Approval Skipping

**Anti-pattern**: Proceeding without user confirmation.

```markdown
❌ Agent: "Here's the plan. Starting implementation..."
   (No pause for approval)

✓ Agent: "Here's the plan. Do you approve proceeding with implementation?"
   User: "Yes, approved"
   Agent: "Starting implementation..."
```

**Why it's bad**: User may have concerns that prevent wasted work.

## Recovery from Anti-Patterns

When you catch yourself in an anti-pattern:

1. **Stop immediately** - Don't dig deeper
2. **Document what happened** - What anti-pattern, what state
3. **Assess damage** - What needs to be undone
4. **Return to correct phase** - Go back to where it went wrong
5. **Learn** - Add to project's anti-pattern documentation
