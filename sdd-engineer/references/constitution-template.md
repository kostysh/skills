# Constitution Template

Use this template to create a project constitution. The constitution defines immutable principles that apply to ALL work in this project.

---

```markdown
# Project Constitution

**Project**: {PROJECT_NAME}
**Created**: {YYYY-MM-DD}
**Last Updated**: {YYYY-MM-DD}

## Purpose

This constitution defines the non-negotiable principles and standards for this project. All specifications, plans, and implementations MUST comply with these articles.

---

## Article I: Code Quality Standards

### 1.1 Type Safety
{e.g., "TypeScript strict mode is mandatory. No `any` types without explicit justification."}

### 1.2 Linting
{e.g., "All code must pass ESLint with the project's configuration. No lint disables without approval."}

### 1.3 Formatting
{e.g., "Prettier is the single source of truth for formatting. Run before every commit."}

---

## Article II: Testing Requirements

### 2.1 Testing Approach
All features MUST have tests. Use RED/GREEN/VERIFY (TDD) only when explicitly requested.

### 2.2 Coverage Thresholds
{e.g., "Minimum 80% line coverage for new code. Critical paths require 100% coverage."}

### 2.3 Test Types Required
- Unit tests: Required for all business logic
- Integration tests: Required for API endpoints
- E2E tests: Required for critical user journeys

### 2.4 Test Environment
{e.g., "Tests must use real database instances, not mocks, for integration tests."}

---

## Article III: Security Principles

### 3.1 Input Validation
All external inputs MUST be validated. Never trust user input.

### 3.2 Authentication & Authorization
{e.g., "All API endpoints require authentication except explicitly public endpoints."}

### 3.3 Secrets Management
No secrets in code. Use environment variables or secrets manager.

### 3.4 Dependency Security
{e.g., "No dependencies with known critical vulnerabilities. Run `npm audit` in CI."}

---

## Article IV: Architecture Principles

### 4.1 Separation of Concerns
{e.g., "Business logic in services, not controllers. Controllers handle HTTP only."}

### 4.2 Dependency Direction
{e.g., "Dependencies point inward. Domain logic has no external dependencies."}

### 4.3 No Premature Abstraction
Don't create abstractions for single use cases. Three instances before abstracting.

### 4.4 Simplicity
Prefer simple, readable code over clever code. Optimize only when measured.

---

## Article V: API Design

### 5.1 Versioning
{e.g., "All APIs use URL versioning: /api/v1/resource"}

### 5.2 Response Format
{e.g., "All responses are JSON. Errors follow RFC 7807 Problem Details."}

### 5.3 Naming Conventions
{e.g., "Resources are plural nouns. Actions use HTTP verbs."}

---

## Article VI: Database Principles

### 6.1 Migrations
All schema changes via migrations. No manual database modifications.

### 6.2 Naming Conventions
{e.g., "Tables: plural_snake_case. Columns: snake_case. Foreign keys: table_id"}

### 6.3 Indexing
{e.g., "All foreign keys must be indexed. Query patterns determine additional indexes."}

---

## Article VII: Documentation

### 7.1 Code Comments
Comments explain WHY, not WHAT. Code should be self-documenting for WHAT.

### 7.2 API Documentation
{e.g., "OpenAPI spec required for all endpoints. Keep in sync with implementation."}

### 7.3 README Requirements
{e.g., "Every service has README with: purpose, setup, running, testing."}

---

## Article VIII: Error Handling

### 8.1 No Silent Failures
All errors must be logged. No empty catch blocks.

### 8.2 User-Facing Errors
{e.g., "Error messages are user-friendly. No stack traces in production responses."}

### 8.3 Error Recovery
{e.g., "Prefer graceful degradation over complete failure when possible."}

---

## Article IX: Performance

### 9.1 Response Time Targets
{e.g., "API responses < 200ms p95. Pages load < 3s on 3G."}

### 9.2 Resource Limits
{e.g., "No unbounded queries. All list endpoints paginated. Max 100 items per page."}

### 9.3 Monitoring
{e.g., "All services expose health endpoints and metrics."}

---

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Language | {e.g., TypeScript} | {e.g., 5.x} |
| Runtime | {e.g., Node.js} | {e.g., 20.x LTS} |
| Framework | {e.g., Express} | {e.g., 4.x} |
| Database | {e.g., PostgreSQL} | {e.g., 15.x} |
| Testing | {e.g., Jest} | {e.g., 29.x} |
| CI/CD | {e.g., GitHub Actions} | - |

---

## Amendment Process

This constitution may only be amended through:
1. Proposal with clear rationale
2. Team review and discussion
3. Consensus or designated approver sign-off
4. Version update with change log

---

## Change Log

| Date | Article | Change | Reason |
|------|---------|--------|--------|
| {date} | - | Initial version | Project creation |
```

---

## Template Usage Notes

1. **Customize for your project** - Not all articles apply to all projects
2. **Be specific** - Vague principles are ignored
3. **Keep it short** - Long constitutions aren't read
4. **Enforce in CI** - Whatever can be automated, should be
5. **Review periodically** - Update as project evolves
6. **Team buy-in** - Constitution without agreement is ignored
7. **Use emojis for status/highlights** - e.g., ✅ Adopted, ⚠️ Needs review
