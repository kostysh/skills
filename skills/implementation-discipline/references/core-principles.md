# Core principles

Read this reference when choosing between materially different designs or when the complexity exception gate applies.

## Compare total conceptual surface

Compare candidate designs by everything a maintainer must understand after the change:

- new concepts and vocabulary;
- control flow and interactions;
- ownership and lifecycle boundaries;
- dependencies and their behavior;
- configuration and state;
- failure and recovery paths.

Prefer an existing primitive only when it makes that whole surface smaller. An installed dependency, shared helper, or existing abstraction may be more complex than direct local code when it adds unrelated behavior or indirection.

## Apply the complexity exception gate

For each proposed abstraction, dependency, layer, provider, factory, interface, wrapper, configuration surface, persistent state, background process, or extension point, answer:

1. Which current requirement or protected boundary requires it?
2. Why is a direct local change or existing primitive insufficient?

If either answer is missing, remove the concept. Real protected boundaries include security and compatibility boundaries, transactions, public contracts, and established repeated use. Possible future reuse is not established repeated use.

Do not require this defense for an ordinary direct change.

## Avoid false simplicity

Do not choose a shorter design when it:

- weakens correctness, security, compatibility, or required verification;
- hides behavior in clever code or surprising coupling;
- ignores an established architectural boundary;
- moves complexity to another owner without reducing it.

Fit the existing system rather than redesigning it for blank-slate elegance. Use project purpose only to identify a misleading, insufficient, or unnecessary local task; it does not authorize adjacent implementation.
