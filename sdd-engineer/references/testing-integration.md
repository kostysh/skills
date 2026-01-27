# Testing Integration Guide

## Testing in SDD

### Primary testing guidance

Use the `typescript-test-engineer` skill for test organization, runners, mocks, and coverage strategy. This guide focuses on SDD-specific traceability and how tests map to acceptance criteria.

### Default rule

- Tests are required for new behavior.
- The testing approach is defined in the plan.
- Use RED/GREEN/VERIFY (TDD) **only when explicitly requested**.

### Optional: RED/GREEN/VERIFY (TDD)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌─────┐         ┌─────────┐         ┌──────────┐         │
│   │ RED │────────►│  GREEN  │────────►│  VERIFY  │─────┐   │
│   └─────┘         └─────────┘         └──────────┘     │   │
│      ▲                                                 │   │
│      │                                                 │   │
│      └─────────────────────────────────────────────────┘   │
│                    Next requirement                        │
└─────────────────────────────────────────────────────────────┘
```

#### RED Phase

Write a test that fails because the feature doesn't exist yet.

```javascript
// RED: Test for user login (feature doesn't exist)
describe('AuthService', () => {
  test('login with valid credentials returns user and token', async () => {
    const result = await authService.login('user@test.com', 'password123');

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('user@test.com');
    expect(result.token).toBeDefined();
    expect(result.token).toMatch(/^eyJ/); // JWT format
  });
});
```

**Test should fail because**:
- Function doesn't exist
- Function exists but returns wrong value

**Test should NOT fail because**:
- Syntax error in test
- Wrong assertion
- Missing test setup

#### GREEN Phase

Write the **minimum** code to make the test pass.

```javascript
// GREEN: Minimal implementation
class AuthService {
  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !await this.verifyPassword(password, user.passwordHash)) {
      throw new AuthError('Invalid credentials');
    }
    const token = this.generateToken(user);
    return { user, token };
  }
}
```

**Minimum means**:
- Only what the test requires
- No extra features
- No premature optimization
- No "nice to have" additions

#### VERIFY Phase

Confirm the implementation meets acceptance criteria.

```javascript
// VERIFY: Check against acceptance criteria
// AC-1.1: Valid credentials → return user and token ✓
// AC-1.2: Invalid credentials → throw error
test('login with invalid password throws AuthError', async () => {
  await expect(
    authService.login('user@test.com', 'wrongpassword')
  ).rejects.toThrow(AuthError);
});

// AC-1.3: Non-existent user → throw error (same message for security)
test('login with non-existent user throws AuthError', async () => {
  await expect(
    authService.login('noone@test.com', 'password')
  ).rejects.toThrow(AuthError);
});
```

---

## Mapping Acceptance Criteria to Tests

### From Given/When/Then to Test

```markdown
**AC-1.1**: User can log in with valid credentials
- **Given** a registered user with email "user@test.com" and password "pass123"
- **When** they submit the login form with correct credentials
- **Then** they receive a valid authentication token
- **And** the token contains their user ID
```

Translates to:

```javascript
describe('AC-1.1: User can log in with valid credentials', () => {
  let registeredUser;

  // GIVEN: A registered user
  beforeEach(async () => {
    registeredUser = await createUser({
      email: 'user@test.com',
      password: 'pass123'
    });
  });

  // WHEN: They submit login with correct credentials
  // THEN: They receive a valid token
  test('returns valid authentication token', async () => {
    const result = await authService.login('user@test.com', 'pass123');

    expect(result.token).toBeDefined();
    expect(isValidJWT(result.token)).toBe(true);
  });

  // AND: Token contains user ID
  test('token contains user ID', async () => {
    const result = await authService.login('user@test.com', 'pass123');
    const decoded = decodeJWT(result.token);

    expect(decoded.userId).toBe(registeredUser.id);
  });
});
```

### Coverage Matrix

Track which tests cover which criteria:

| Acceptance Criteria | Test File | Test Name | Status |
|---------------------|-----------|-----------|--------|
| AC-1.1 | auth.test.ts | returns valid token | ✓ |
| AC-1.1 | auth.test.ts | token contains user ID | ✓ |
| AC-1.2 | auth.test.ts | invalid password throws | ✓ |
| AC-1.3 | auth.test.ts | locked account message | ✓ |

---

## Test Types in SDD

### Unit Tests

Test individual functions/methods in isolation.

**When to write**: For all business logic, utilities, and services.

```javascript
// Unit test for password validation
describe('PasswordValidator', () => {
  test('rejects passwords under 8 characters', () => {
    expect(validatePassword('short')).toEqual({
      valid: false,
      errors: ['Password must be at least 8 characters']
    });
  });

  test('requires at least one uppercase letter', () => {
    expect(validatePassword('lowercase1')).toEqual({
      valid: false,
      errors: ['Password must contain an uppercase letter']
    });
  });
});
```

### Integration Tests

Test how components work together.

**When to write**: For API endpoints, database operations, service interactions.

```javascript
// Integration test for login endpoint
describe('POST /api/auth/login', () => {
  test('returns 200 and token for valid credentials', async () => {
    await createUser({ email: 'test@test.com', password: 'Password123' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'Password123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  test('returns 401 for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });
});
```

### End-to-End Tests

Test complete user journeys.

**When to write**: For critical user flows, after unit and integration tests.

```javascript
// E2E test for login flow
describe('User Login Flow', () => {
  test('user can log in and access dashboard', async () => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in credentials
    await page.fill('[data-testid="email"]', 'user@test.com');
    await page.fill('[data-testid="password"]', 'Password123');
    await page.click('[data-testid="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toHaveText('Welcome back');
  });
});
```

---

## Test Organization

### File Structure

```
tests/
├── unit/
│   ├── services/
│   │   └── auth.service.test.ts
│   └── utils/
│       └── validation.test.ts
├── integration/
│   ├── api/
│   │   └── auth.api.test.ts
│   └── db/
│       └── user.repository.test.ts
└── e2e/
    └── flows/
        └── login.flow.test.ts
```

### Naming Conventions

```javascript
// File: {component}.test.ts
// auth.service.test.ts

// Describe: Component/Module name
describe('AuthService', () => {

  // Nested describe: Method/Function
  describe('login', () => {

    // Test: Behavior description
    test('returns token for valid credentials', () => {});
    test('throws for invalid password', () => {});
    test('throws for non-existent user', () => {});
  });
});
```

---

## Common Testing Patterns

### Setup and Teardown

```javascript
describe('UserService', () => {
  let testDb;
  let userService;

  // Before all tests in this describe
  beforeAll(async () => {
    testDb = await createTestDatabase();
  });

  // Before each test
  beforeEach(async () => {
    await testDb.clear();
    userService = new UserService(testDb);
  });

  // After all tests
  afterAll(async () => {
    await testDb.close();
  });
});
```

### Test Data Factories

```javascript
// factories/user.factory.ts
export function createTestUser(overrides = {}) {
  return {
    id: uuid(),
    email: `test-${uuid()}@test.com`,
    name: 'Test User',
    createdAt: new Date(),
    ...overrides
  };
}

// In tests
const user = createTestUser({ name: 'Custom Name' });
```

### Mocking External Services

```javascript
// Mock external API
jest.mock('../services/payment.service');

describe('OrderService', () => {
  test('creates order when payment succeeds', async () => {
    // Arrange
    paymentService.charge.mockResolvedValue({ success: true });

    // Act
    const order = await orderService.create(orderData);

    // Assert
    expect(order.status).toBe('confirmed');
    expect(paymentService.charge).toHaveBeenCalledWith(orderData.amount);
  });
});
```

---

## Testing Anti-Patterns to Avoid

### Testing Implementation, Not Behavior

```javascript
// ❌ Bad: Tests implementation details
test('calls hashPassword before saving', () => {
  const hashSpy = jest.spyOn(crypto, 'hashPassword');
  userService.register(userData);
  expect(hashSpy).toHaveBeenCalled();
});

// ✓ Good: Tests behavior
test('stores password securely', async () => {
  await userService.register({ ...userData, password: 'plaintext' });
  const user = await db.users.findByEmail(userData.email);
  expect(user.passwordHash).not.toBe('plaintext');
  expect(user.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt format
});
```

### Brittle Tests

```javascript
// ❌ Bad: Breaks if message changes
test('shows error', async () => {
  const result = await login('bad@email', 'pass');
  expect(result.error).toBe('The email address you entered is invalid. Please check and try again.');
});

// ✓ Good: Tests essential behavior
test('rejects invalid email', async () => {
  const result = await login('bad@email', 'pass');
  expect(result.success).toBe(false);
  expect(result.error).toContain('email');
});
```

### Test Interdependence

```javascript
// ❌ Bad: Test B depends on Test A's side effects
test('A: creates user', async () => {
  await createUser({ email: 'test@test.com' });
});

test('B: finds created user', async () => {
  const user = await findUser('test@test.com'); // Depends on test A!
  expect(user).toBeDefined();
});

// ✓ Good: Each test is independent
test('finds existing user', async () => {
  await createUser({ email: 'test@test.com' });
  const user = await findUser('test@test.com');
  expect(user).toBeDefined();
});
```

---

## Test Coverage Guidelines

### What to Cover

- All acceptance criteria (100%)
- All business logic (high coverage)
- Error handling paths
- Edge cases from requirements

### What Not to Over-Test

- Framework code (trust the framework)
- Simple getters/setters
- Configuration files
- Third-party libraries

### Coverage Thresholds (Example)

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "src/services/": {
      "branches": 90,
      "functions": 90
    }
  }
}
```

---

## Integration with SDD Phases

### Requirements Phase
- Review acceptance criteria for testability
- Ensure criteria are specific enough to test

### Specification Phase
- Include testing strategy section
- Identify test types needed

### Planning Phase
- Define testing strategy and verification per step
- If TDD is requested, place test steps before implementation steps

### Tasks Phase
- Add test tasks per the plan's testing strategy
- If TDD is requested, make implementation tasks depend on test tasks

### Implementation Phase
- If TDD is requested: RED -> GREEN -> VERIFY
- Otherwise: follow the plan's testing steps and project conventions

### Validation Phase
- Run full test suite
- Verify coverage
- Check acceptance criteria mapping
