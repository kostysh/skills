# Component composition

Fetch current component docs and inspect installed wrappers before relying on these patterns.

## Groups and structure

Use the documented group/list structure for collection components:

- `SelectItem` inside `SelectGroup`;
- menu items inside documented menu groups;
- `CommandItem` inside `CommandGroup` and `CommandList`;
- `TabsTrigger` inside `TabsList`.

Do not introduce wrapper elements between a trigger and the element that owns its interactive behavior unless current docs require them.

## Custom triggers

Current Base UI wrappers use documented composition props such as `render` for custom triggers. Fetch docs for the installed component before assuming support.

```tsx
<DialogTrigger render={<Button variant="outline" />}>
  Open
</DialogTrigger>
```

The rendered component must preserve forwarded props and refs required by the wrapper.

## Links styled as buttons

Use `buttonVariants` on a real link so link semantics remain intact:

```tsx
import { buttonVariants } from "@/components/ui/button"

<a className={buttonVariants({ variant: "outline" })} href="/docs">
  Read the docs
</a>
```

Use the project's actual alias. Do not replace link semantics with a button role.

## Accessible overlays

- Give `Dialog`, `Sheet`, and `Drawer` content an accessible title.
- Use the documented description when additional context is needed.
- Use `className="sr-only"` for a title that should be visually hidden.
- Keep destructive confirmation in `AlertDialog` rather than a generic dialog.

Run a keyboard/focus smoke check when overlay behavior changes; source shape alone does not prove focus management.

## Common composition

- Use `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter` according to content structure; omit parts that have no content instead of filling them artificially.
- Include `AvatarFallback` when an avatar image can fail or be absent.
- Compose loading buttons with `Spinner`, `disabled`, and the documented icon-spacing attribute.
- Use `Alert`, `Empty`, `Separator`, `Skeleton`, `Badge`, and `sonner` when they match the intended semantics; do not force them when native markup communicates the requirement more clearly.

## Verification

- Inspect the installed component API and generated DOM assumptions.
- Run typecheck and the relevant project checks.
- Exercise trigger, close, focus return, keyboard navigation, and disabled/loading behavior for changed interactive components.
- Route a formal accessibility or UX verdict to `web-ui-reviewer`.
