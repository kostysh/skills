# Bulletproof React Component Patterns

This reference captures the full hardening guidance from:
`https://shud.in/thoughts/build-bulletproof-react-components`

Use this file when implementing or reviewing component-level resilience.

## Table of Contents

1. [Server-Proof](#1-server-proof)
2. [Hydration-Proof](#2-hydration-proof)
3. [Instance-Proof](#3-instance-proof)
4. [Concurrent-Proof](#4-concurrent-proof)
5. [Composition-Proof](#5-composition-proof)
6. [Portal-Proof](#6-portal-proof)
7. [Transition-Proof](#7-transition-proof)
8. [Activity-Proof](#8-activity-proof)
9. [Leak-Proof](#9-leak-proof)
10. [Future-Proof](#10-future-proof)
11. [Review Matrix](#11-review-matrix)

## 1. Server-Proof

### Failure mode

Browser APIs (`window`, `document`, `localStorage`, `matchMedia`, `ResizeObserver`) run during server render and crash.

### Required pattern

- Keep render paths server-safe.
- Move browser-only reads/writes to effects or other client-only phases.

```tsx
import { useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  }, []);

  return <div className={theme}>{children}</div>;
}
```

## 2. Hydration-Proof

### Failure mode

Theme or other critical UI state is correct only after hydration, causing a flash or mismatch.

### Required pattern

- If value is needed before first paint, set it synchronously before hydration.
- Typical approach: small inline script in HTML shell that applies theme class/attribute.

```html
<script>
  const t = localStorage.getItem("theme");
  if (t === "dark") document.documentElement.classList.add("dark");
</script>
```

Use this only for truly paint-critical state.

## 3. Instance-Proof

### Failure mode

Reusable components hardcode DOM ids, so multiple instances collide.

### Required pattern

- Use `useId()` for deterministic per-instance IDs.

```tsx
import { useId } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const styleId = useId();
  return (
    <>
      <style id={styleId}>{".dark { background: black; }"}</style>
      {children}
    </>
  );
}
```

## 4. Concurrent-Proof

### Failure mode

Multiple server components request the same async data and duplicate work.

### Required pattern

- Memoize request-scoped async work with `cache()` from React.

```tsx
import { cache } from "react";

const getTheme = cache(async (userId: string) => {
  return db.themes.get(userId);
});
```

This is especially relevant in RSC/concurrent server rendering paths.

## 5. Composition-Proof

### Failure mode

`cloneElement` assumes `children` is a plain React element. This breaks with async/opaque child values in modern React usage.

### Required pattern

- Prefer Context to pass data to descendants.
- Treat `children` as opaque.

```tsx
import { createContext, useContext } from "react";

const ThemeContext = createContext("light");

export function ThemeProvider({
  theme,
  children,
}: {
  theme: string;
  children: React.ReactNode;
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

## 6. Portal-Proof

### Failure mode

Code assumes global `window` and fails when a component renders in an iframe, portal root, or pop-out window.

### Required pattern

- Resolve the active window from the component node: `ownerDocument.defaultView`.
- Attach listeners to that resolved window, not the global one.

```tsx
import { useEffect, useRef } from "react";

export function ThemeListener() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const win = ref.current?.ownerDocument?.defaultView;
    if (!win) return;

    const onStorage = () => {};
    win.addEventListener("storage", onStorage);
    return () => win.removeEventListener("storage", onStorage);
  }, []);

  return <div ref={ref} />;
}
```

## 7. Transition-Proof

### Failure mode

React 19 View Transition animation snaps because the update is urgent.

### Required pattern

- Wrap UI state updates that should participate in view transitions in `startTransition()`.

```tsx
import { startTransition, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  function toggle() {
    startTransition(() => {
      setTheme((t) => (t === "light" ? "dark" : "light"));
    });
  }

  return <button onClick={toggle}>Toggle</button>;
}
```

## 8. Activity-Proof

### Failure mode

`<Activity />` can keep hidden trees mounted. Global side effects (for example root-level style tags) may still affect visible UI.

### Required pattern

- Explicitly disable side effects when hidden and re-enable when active.
- A robust approach for style tags is toggling `media`.

```tsx
import { useLayoutEffect, useRef } from "react";

export function ThemeStyles({ active }: { active: boolean }) {
  const styleRef = useRef<HTMLStyleElement>(null);

  useLayoutEffect(() => {
    if (!styleRef.current) return;
    styleRef.current.media = active ? "all" : "not all";
    return () => {
      if (styleRef.current) styleRef.current.media = "not all";
    };
  }, [active]);

  return <style ref={styleRef}>{".dark { background: black; }"}</style>;
}
```

## 9. Leak-Proof

### Failure mode

Sensitive server-side values flow through component trees and can accidentally reach client boundaries.

### Required pattern

- Mark sensitive values/objects with React experimental taint APIs.
- Apply at server boundaries before passing data to component trees.

```tsx
import {
  experimental_taintObjectReference,
  experimental_taintUniqueValue,
} from "react";

async function getUserData(userId: string) {
  const user = await db.users.get(userId);
  experimental_taintUniqueValue("Do not pass token to client", user, user.token);
  experimental_taintObjectReference("Do not pass entire user to client", user);
  return user;
}
```

Notes:
- APIs are experimental and version-sensitive.
- Even with tainting, still prefer explicit DTO shaping and least-privilege data flow.

## 10. Future-Proof

### Failure mode

Component correctness depends on caching hints such as `useMemo`, but React may discard memoized values (for example on HMR, offscreen behavior, or future runtime changes).

### Required pattern

- Treat `useMemo` as optimization only.
- If semantic persistence is required, use `useState`/`useRef` with explicit lifecycle.
- Use a defensive mindset, but do not apply defensive complexity everywhere.

```tsx
import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

## 11. Review Matrix

Use this matrix for PR review of reusable components.

| Check | What to verify |
|------|-----------------|
| Server | No browser API in server render paths |
| Hydration | No first-paint mismatch for critical UI state |
| Instance | No shared hardcoded IDs or global mutable singleton assumptions |
| Concurrent | Request-scoped async dedupe where duplicate calls are possible |
| Composition | No fragile `cloneElement`-based contract with arbitrary children |
| Portal | Event/document/window references derive from mounted node context |
| Transition | Transition-sensitive updates wrapped in `startTransition` |
| Activity | Hidden trees do not leave active global side effects |
| Leak | Sensitive values protected at server boundary |
| Future | Correctness does not depend on disposable memo caches |
