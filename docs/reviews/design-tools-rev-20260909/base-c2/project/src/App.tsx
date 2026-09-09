import { useRef, useState, type FormEvent } from "react"
import { ArrowRightIcon, BellIcon, CheckIcon } from "lucide-react"
import { Button } from "~ui/components/ui/button"
import { Input } from "~ui/components/ui/input"
import { Switch } from "~ui/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "~ui/components/ui/radio-group"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "~ui/components/ui/field"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~ui/components/ui/dialog"

type Settings = { email: string; enabled: boolean; frequency: "daily" | "weekly" }

export function App() {
  const [draft, setDraft] = useState<Settings>({ email: "", enabled: true, frequency: "daily" })
  const [applied, setApplied] = useState<Settings | null>(null)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const reviewRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!emailRef.current?.validity.valid) {
      setError(draft.email.trim() ? "Enter a valid email address." : "Enter your email address.")
      emailRef.current?.focus()
      return
    }
    setError("")
    setOpen(true)
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-3xl px-5 py-10 sm:px-10 sm:py-20">
      <header className="mb-8 flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
          <BellIcon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium tracking-widest text-muted-foreground uppercase">Preferences</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Notification settings</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Choose where and how often you receive updates.</p>
        </div>
      </header>

      <form noValidate onSubmit={review} className="rounded-xl border bg-card text-card-foreground">
        <FieldGroup className="gap-7 p-5 sm:p-8">
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="email">Email address <span className="text-muted-foreground">(required)</span></FieldLabel>
            <Input ref={emailRef} id="email" name="email" type="email" autoComplete="email" required value={draft.email}
              onChange={(event) => { setDraft({ ...draft, email: event.target.value }); setError("") }}
              aria-invalid={!!error} aria-describedby={error ? "email-hint email-error" : "email-hint"} placeholder="you@example.com" />
            <FieldDescription id="email-hint">The address for your notification updates.</FieldDescription>
            {error && <FieldError id="email-error">{error}</FieldError>}
          </Field>

          <Field orientation="horizontal" className="border-y py-6">
            <FieldContent>
              <FieldLabel htmlFor="notifications">Enable notifications</FieldLabel>
              <FieldDescription id="notifications-hint">Pause updates whenever you need a little quiet.</FieldDescription>
            </FieldContent>
            <Switch id="notifications" checked={draft.enabled} onCheckedChange={(enabled) => setDraft({ ...draft, enabled })} aria-describedby="notifications-hint" />
          </Field>

          <FieldSet disabled={!draft.enabled}>
            <FieldLegend id="frequency-label">Delivery frequency</FieldLegend>
            <FieldDescription id="frequency-hint">{draft.enabled ? "Choose the pace that works for you." : "Turn notifications on to change frequency. Your selection is kept."}</FieldDescription>
            <RadioGroup value={draft.frequency} disabled={!draft.enabled} aria-labelledby="frequency-label" aria-describedby="frequency-hint"
              onValueChange={(value) => { if (value === "daily" || value === "weekly") setDraft({ ...draft, frequency: value }) }} className="gap-3 sm:grid-cols-2">
              {(["daily", "weekly"] as const).map((frequency) => (
                <FieldLabel key={frequency} htmlFor={frequency}>
                  <Field orientation="horizontal" data-disabled={!draft.enabled}>
                    <RadioGroupItem id={frequency} value={frequency} disabled={!draft.enabled} />
                    <FieldContent>
                      <span>{frequency === "daily" ? "Daily" : "Weekly"}</span>
                      <span className="text-xs font-normal text-muted-foreground">{frequency === "daily" ? "A daily catch-up" : "One weekly digest"}</span>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </FieldSet>
        </FieldGroup>
        <div className="flex flex-col gap-4 border-t bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs text-muted-foreground">You’ll review your choices before applying.</p>
          <Button ref={reviewRef} type="submit" variant="brand" size="lg">Review changes <ArrowRightIcon aria-hidden="true" data-icon="inline-end" /></Button>
        </div>
      </form>

      <div role="status" aria-live="polite" aria-atomic="true" className="mt-6">
        {applied && <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-5">
          <CheckIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 text-sm leading-relaxed">
            <p className="font-semibold">Settings applied</p>
            <p className="break-words">{applied.email}</p>
            <p>{applied.enabled ? `Notifications on · ${applied.frequency === "daily" ? "Daily" : "Weekly"} delivery` : `Notifications off · ${applied.frequency === "daily" ? "Daily" : "Weekly"} preference saved`}</p>
          </div>
        </div>}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">These settings last for this session. No emails will be sent.</p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent initialFocus={cancelRef} finalFocus={reviewRef} showCloseButton={false} className="max-h-[calc(100svh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review notification settings</DialogTitle>
            <DialogDescription>Confirm to apply these choices. Cancel to keep editing your draft.</DialogDescription>
          </DialogHeader>
          <dl className="grid gap-4 py-2 text-sm">
            <div><dt className="text-muted-foreground">Email address</dt><dd className="mt-1 break-words font-medium">{draft.email}</dd></div>
            <div><dt className="text-muted-foreground">Notifications</dt><dd className="mt-1 font-medium">{draft.enabled ? "On" : "Off"}</dd></div>
            <div><dt className="text-muted-foreground">Delivery frequency</dt><dd className="mt-1 font-medium">{draft.frequency === "daily" ? "Daily" : "Weekly"}{!draft.enabled && " (saved for when notifications are on)"}</dd></div>
          </dl>
          <DialogFooter>
            <DialogClose render={<Button ref={cancelRef} variant="outline" />}>Cancel</DialogClose>
            <Button variant="brand" onClick={() => { setApplied({ ...draft }); setOpen(false) }}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default App
