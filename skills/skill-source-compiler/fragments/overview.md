This skill exists to help an agent transform a **structured source bundle** into a standard Agent Skills package without relying on hidden repository state. The compiler should preserve semantic intent, remove duplication, enforce precedence, and render a `SKILL.md` whose section order makes the active workflow easy to follow.

The generated skill should favor **progressive disclosure**: keep `SKILL.md` focused on the decisions and procedures the agent needs every time, and place detailed material in linked `references/` files with explicit load triggers.
