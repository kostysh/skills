# Accessibility for React SPA

## Core Principles

**Rule: Accessibility is not optional. Build inclusive apps from the start.**

---

## 1. ARIA Attributes

### aria-label - Accessible Names

```tsx
// When visible text is not available
<button aria-label="Close dialog">
  <CloseIcon />
</button>

// Search button with only icon
<button aria-label="Search">
  <SearchIcon />
</button>

// Input without visible label
<input
  type="search"
  aria-label="Search products"
  placeholder="Search..."
/>
```

### aria-labelledby - Reference Existing Text

```tsx
// Reference heading as label
<section aria-labelledby="section-title">
  <h2 id="section-title">User Settings</h2>
  {/* section content */}
</section>

// Reference multiple elements
<div aria-labelledby="card-title card-subtitle">
  <h3 id="card-title">John Doe</h3>
  <p id="card-subtitle">Software Engineer</p>
</div>
```

### aria-describedby - Additional Description

```tsx
// Form field with help text
<div>
  <label htmlFor="password">Password</label>
  <input
    id="password"
    type="password"
    aria-describedby="password-help password-error"
  />
  <p id="password-help">Must be at least 8 characters</p>
  {error && <p id="password-error" role="alert">{error}</p>}
</div>
```

### aria-invalid - Error States

```tsx
// Form field with validation error
interface InputProps {
  label: string;
  error?: string;
}

function Input({ label, error, ...props }: InputProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <span id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
```

### role="alert" - Live Announcements

```tsx
// Error messages that need immediate announcement
{error && (
  <div role="alert">
    {error}
  </div>
)}

// Success messages
{success && (
  <div role="status" aria-live="polite">
    Changes saved successfully
  </div>
)}

// Loading states
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : 'Content loaded'}
</div>
```

### aria-live Regions

```tsx
// Polite - waits for user to finish current task
<div aria-live="polite">
  {notifications.map((n) => (
    <Notification key={n.id} message={n.message} />
  ))}
</div>

// Assertive - interrupts immediately (use sparingly)
<div aria-live="assertive">
  {criticalError && <p>{criticalError}</p>}
</div>
```

### aria-expanded and aria-controls

```tsx
// Accordion/Disclosure
function Accordion({ title, children }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <div>
      <button
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
      </button>
      <div id={contentId} hidden={!isOpen}>
        {children}
      </div>
    </div>
  );
}

// Dropdown menu
function Dropdown({ label, items }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  return (
    <div>
      <button
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
      </button>
      <ul id={menuId} role="menu" hidden={!isOpen}>
        {items.map((item) => (
          <li key={item.id} role="menuitem">
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### aria-selected for Selection

```tsx
// Tab list
function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

---

## 2. Keyboard Navigation

### Common Key Handlers

```tsx
// ArrowDown, ArrowUp, Enter, Escape pattern
function Listbox({ options, value, onChange }: ListboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          );
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          onChange(options[focusedIndex]);
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;

      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;

      case 'End':
        event.preventDefault();
        setFocusedIndex(options.length - 1);
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      {/* Listbox implementation */}
    </div>
  );
}
```

### Tab Navigation

```tsx
// Skip link for keyboard users
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
      onFocus={(e) => {
        e.currentTarget.style.position = 'static';
        e.currentTarget.style.width = 'auto';
        e.currentTarget.style.height = 'auto';
      }}
      onBlur={(e) => {
        e.currentTarget.style.position = 'absolute';
        e.currentTarget.style.left = '-9999px';
      }}
    >
      Skip to main content
    </a>
  );
}

// In layout
function Layout({ children }: LayoutProps) {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
```

### Focus Trap for Modals

```tsx
import { useRef, useEffect } from 'react';

function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return containerRef;
}
```

---

## 3. Focus Management for Dialogs

```tsx
function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus dialog
      dialogRef.current?.focus();
    } else {
      // Restore focus when closing
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialog-title">{title}</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

### Focus After Route Navigation

```tsx
// Focus main content after navigation
function useFocusOnRouteChange() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);

  return mainRef;
}

function Layout({ children }: LayoutProps) {
  const mainRef = useFocusOnRouteChange();

  return (
    <>
      <Header />
      <main ref={mainRef} tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
```

---

## 4. Skeleton Fallbacks vs Spinners

**Rule: Prefer skeleton screens over spinners. They reduce perceived loading time and prevent layout shift.**

```tsx
// Skeleton component
interface SkeletonProps {
  width?: string;
  height?: string;
}

function Skeleton({ width, height }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

// Skeleton for card
function CardSkeleton() {
  return (
    <div className="card" aria-busy="true" aria-label="Loading...">
      <Skeleton width="100%" height="200px" />
      <div className="card-content">
        <Skeleton width="60%" height="24px" />
        <Skeleton width="100%" height="16px" />
        <Skeleton width="80%" height="16px" />
      </div>
    </div>
  );
}

// Usage with Suspense
const UserProfile = lazy(() => import('./UserProfile'));

function App() {
  return (
    <Suspense fallback={<UserProfileSkeleton />}>
      <UserProfile />
    </Suspense>
  );
}

// Usage with TanStack Query
interface UserCardProps {
  userId: number;
}

function UserCard({ userId }: UserCardProps) {
  const { data, isPending } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  if (isPending) {
    return <CardSkeleton />;
  }

  return <Card user={data} />;
}
```

### CSS for Skeletons

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #e0e0e0 25%,
    #f0f0f0 50%,
    #e0e0e0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: #e0e0e0;
  }
}
```

---

## 5. Form Accessibility

```tsx
function AccessibleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Required field with asterisk */}
      <div>
        <label htmlFor="email">
          Email <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id="email"
          type="email"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : 'email-hint'}
          {...register('email')}
        />
        <p id="email-hint" className="hint">
          We'll never share your email
        </p>
        {errors.email && (
          <p id="email-error" role="alert" className="error">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Fieldset for grouped inputs */}
      <fieldset>
        <legend>Notification Preferences</legend>

        <div>
          <input
            type="checkbox"
            id="email-notifications"
            {...register('emailNotifications')}
          />
          <label htmlFor="email-notifications">Email notifications</label>
        </div>

        <div>
          <input
            type="checkbox"
            id="sms-notifications"
            {...register('smsNotifications')}
          />
          <label htmlFor="sms-notifications">SMS notifications</label>
        </div>
      </fieldset>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Screen Reader Only Text

```css
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## 6. Images and Media

```tsx
// Informative image
<img
  src={product.image}
  alt={`${product.name} - ${product.color} ${product.type}`}
/>

// Decorative image (hide from screen readers)
<img src={decorativePattern} alt="" role="presentation" />

// Icon with text
<button>
  <SaveIcon aria-hidden="true" />
  Save
</button>

// Icon-only button
<button aria-label="Save document">
  <SaveIcon aria-hidden="true" />
</button>

// SVG accessibility
<svg role="img" aria-labelledby="svg-title svg-desc">
  <title id="svg-title">Sales Chart</title>
  <desc id="svg-desc">Bar chart showing monthly sales from January to June</desc>
  {/* SVG content */}
</svg>
```

---

## 7. Color and Contrast

```tsx
// Don't rely on color alone
interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const icons = {
    success: <CheckIcon aria-hidden="true" />,
    error: <ErrorIcon aria-hidden="true" />,
    warning: <WarningIcon aria-hidden="true" />,
  };

  const labels = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
  };

  return (
    <span className={`badge badge-${status}`}>
      {icons[status]}
      <span>{labels[status]}</span>
    </span>
  );
}

// Focus indicators
// Never remove focus outlines without providing alternative
button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

// High contrast focus for custom focus states
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.5);
}
```

---

## 8. Testing Accessibility

```tsx
import { render, screen } from '@testing-library/react';

// Testing with accessible queries
test('form is accessible', () => {
  render(<LoginForm />);

  // These queries ensure accessibility
  expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
});

// Testing error states
test('shows accessible error message', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.click(screen.getByRole('button', { name: /log in/i }));

  // Error announced via role="alert"
  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent(/email is required/i);

  // Input marked as invalid
  expect(screen.getByRole('textbox', { name: /email/i })).toHaveAttribute(
    'aria-invalid',
    'true'
  );
});

// Testing keyboard navigation
test('supports keyboard navigation', async () => {
  const user = userEvent.setup();
  render(<Dropdown options={options} />);

  // Open with keyboard
  await user.tab(); // Focus trigger
  await user.keyboard('{Enter}'); // Open

  // Navigate with arrows
  await user.keyboard('{ArrowDown}');
  await user.keyboard('{ArrowDown}');
  await user.keyboard('{Enter}'); // Select

  // Escape closes
  await user.keyboard('{Enter}'); // Reopen
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
```

---

## Best Practices Summary

1. **aria-label** - When visible text unavailable (icon buttons)
2. **aria-invalid + aria-describedby** - Form error states
3. **role="alert"** - Error messages for screen readers
4. **aria-expanded + aria-controls** - Collapsible content
5. **ArrowDown/Up, Enter, Escape** - Standard keyboard patterns
6. **Focus trap in dialogs** - Prevent focus escape
7. **Return focus on close** - Restore previous focus
8. **Skeleton > Spinner** - Better perceived performance
9. **sr-only for context** - Hidden text for screen readers
10. **Test with getByRole** - Ensures accessible markup
