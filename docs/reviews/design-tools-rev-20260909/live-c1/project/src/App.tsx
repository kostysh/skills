import { useRef, useState, type FormEvent } from "react"
import { ArrowRightIcon, BellIcon, CheckIcon } from "lucide-react"
import { Button } from "~ui/components/ui/button"
import { Input } from "~ui/components/ui/input"
import { Switch } from "~ui/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "~ui/components/ui/radio-group"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~ui/components/ui/dialog"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "~ui/components/ui/field"

type Settings = { email: string; enabled: boolean; frequency: "daily" | "weekly" }

export default function App() {
  const [draft, setDraft] = useState<Settings>({ email: "", enabled: true, frequency: "daily" })
  const [applied, setApplied] = useState<Settings | null>(null)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const reviewRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = emailRef.current
    if (!input || !input.validity.valid) {
      setError(input?.validity.valueMissing ? "Enter your email address." : "Enter a valid email address.")
      input?.focus()
      return
    }
    setError("")
    setOpen(true)
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col gap-10 px-5 py-10 sm:px-10 sm:py-16">
      <header className="flex items-center gap-3 border-b pb-5">
        <BellIcon aria-hidden="true" className="size-5" />
        <span className="text-sm font-medium">Your preferences</span>
      </header>
      <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] md:gap-16">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Stay in the loop</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Notification settings</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">Choose where and how often you receive updates. Review your preferences before applying them.</p>
          <p className="text-xs leading-relaxed text-muted-foreground">Settings apply to this session only. No emails are sent.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <form noValidate onSubmit={review} className="flex min-w-0 flex-col gap-7 rounded-xl border bg-card p-5 text-card-foreground sm:p-7">
            <FieldGroup className="gap-7">
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor="email">Email address <span className="text-muted-foreground">(required)</span></FieldLabel>
                <Input ref={emailRef} id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" value={draft.email} onChange={(event) => { setDraft({ ...draft, email: event.target.value }); setError("") }} aria-invalid={!!error} aria-describedby={error ? "email-help email-error" : "email-help"} />
                <FieldDescription id="email-help">The address for your notification updates.</FieldDescription>
                {error && <FieldError id="email-error">{error}</FieldError>}
              </Field>
              <Field orientation="horizontal" className="border-y py-5">
                <FieldContent>
                  <FieldLabel htmlFor="notifications">Notifications</FieldLabel>
                  <FieldDescription id="notifications-help">Turn updates on or pause them anytime.</FieldDescription>
                </FieldContent>
                <Switch id="notifications" checked={draft.enabled} onCheckedChange={(enabled) => setDraft({ ...draft, enabled })} aria-describedby="notifications-help" />
              </Field>
              <FieldSet disabled={!draft.enabled}>
                <FieldLegend id="frequency-label" variant="label">Delivery frequency</FieldLegend>
                <FieldDescription id="frequency-help">{draft.enabled ? "Choose the rhythm that suits you." : "Turn notifications on to change frequency. Your choice is kept."}</FieldDescription>
                <RadioGroup value={draft.frequency} onValueChange={(frequency) => { if (frequency === "daily" || frequency === "weekly") setDraft({ ...draft, frequency }) }} disabled={!draft.enabled} aria-labelledby="frequency-label" aria-describedby="frequency-help" className="grid gap-3 sm:grid-cols-2">
                  {(["daily", "weekly"] as const).map((frequency) => (
                    <Field key={frequency} orientation="horizontal" data-disabled={!draft.enabled} className="rounded-lg border p-4">
                      <RadioGroupItem value={frequency} id={frequency} disabled={!draft.enabled} />
                      <FieldLabel htmlFor={frequency}>{frequency === "daily" ? "Daily" : "Weekly"}</FieldLabel>
                    </Field>
                  ))}
                </RadioGroup>
              </FieldSet>
            </FieldGroup>
            <div className="flex flex-col gap-3 border-t pt-5">
              <Button ref={reviewRef} type="submit" variant="brand" size="lg" aria-haspopup="dialog" aria-expanded={open}>
                Review changes <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">You can still make changes before confirming.</p>
            </div>
            <div role="status" aria-live="polite" aria-atomic="true">
              {applied && <div className="flex items-start gap-3 rounded-lg border bg-muted p-4 text-sm">
                <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="font-medium">Settings applied for this session.</p>
                  <p className="break-words text-muted-foreground">Last applied: {applied.email}. Notifications {applied.enabled ? "on" : "off"}. {applied.enabled ? `Delivery: ${applied.frequency}.` : `Saved frequency: ${applied.frequency} (paused).`}</p>
                </div>
              </div>}
            </div>
          </form>
          <DialogContent showCloseButton={false} className="max-h-[calc(100svh-2rem)] overflow-y-auto" onOpenAutoFocus={(event) => { event.preventDefault(); cancelRef.current?.focus() }} onCloseAutoFocus={(event) => { event.preventDefault(); reviewRef.current?.focus() }}>
            <DialogHeader>
              <DialogTitle>Review notification settings</DialogTitle>
              <DialogDescription>Confirm these preferences for this session, or cancel to keep editing your draft.</DialogDescription>
            </DialogHeader>
            <dl className="grid min-w-0 gap-4 py-2">
              <div><dt className="text-muted-foreground">Email address</dt><dd className="break-words font-medium">{draft.email}</dd></div>
              <div><dt className="text-muted-foreground">Notifications</dt><dd className="font-medium">{draft.enabled ? "On" : "Off"}</dd></div>
              <div><dt className="text-muted-foreground">Delivery frequency</dt><dd className="font-medium">{draft.frequency === "daily" ? "Daily" : "Weekly"}{!draft.enabled && " (paused)"}</dd></div>
            </dl>
            <DialogFooter>
              <DialogClose asChild><Button ref={cancelRef} type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="button" variant="brand" onClick={() => { setApplied({ ...draft }); setOpen(false) }}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
