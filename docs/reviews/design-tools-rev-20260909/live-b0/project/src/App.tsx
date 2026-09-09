import { useRef, useState, type SubmitEvent } from "react"
import { Button } from "~ui/components/ui/button"
import { Input } from "~ui/components/ui/input"
import { Switch } from "~ui/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "~ui/components/ui/radio-group"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "~ui/components/ui/field"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~ui/components/ui/dialog"

type Settings = { email: string; enabled: boolean; frequency: "daily" | "weekly" }

export default function App() {
  const [draft, setDraft] = useState<Settings>({ email: "", enabled: true, frequency: "daily" })
  const [pending, setPending] = useState<Settings | null>(null)
  const [applied, setApplied] = useState<Settings | null>(null)
  const [error, setError] = useState("")
  const emailRef = useRef<HTMLInputElement>(null)
  const reviewRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  function review(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!emailRef.current?.validity.valid) {
      setError(draft.email ? "Enter a valid email address." : "Enter your email address.")
      emailRef.current?.focus()
      return
    }
    setError("")
    setPending({ ...draft })
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-20">
      <header className="mb-8">
        <p className="mb-3 text-sm font-medium text-muted-foreground">Preferences</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Notification settings</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">Choose where and how often you hear from us.</p>
      </header>

      <form noValidate onSubmit={review} className="rounded-xl border bg-card p-5 text-card-foreground sm:p-8">
        <FieldGroup className="gap-8">
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="email">Email address <span className="text-muted-foreground">(required)</span></FieldLabel>
            <Input ref={emailRef} id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" value={draft.email} className="h-11"
              aria-invalid={!!error} aria-describedby={error ? "email-help email-error" : "email-help"}
              onChange={(event) => { setDraft({ ...draft, email: event.target.value }); setError("") }} />
            <FieldDescription id="email-help">Your preferred address for notification emails.</FieldDescription>
            {error && <FieldError id="email-error">{error}</FieldError>}
          </Field>

          <Field orientation="horizontal" className="border-y py-6">
            <FieldContent>
              <FieldLabel htmlFor="notifications">Email notifications</FieldLabel>
              <FieldDescription id="notifications-help">Turn updates on or pause them at any time.</FieldDescription>
            </FieldContent>
            <Switch id="notifications" checked={draft.enabled} onCheckedChange={(enabled) => setDraft({ ...draft, enabled })} aria-describedby="notifications-help" />
          </Field>

          <FieldSet disabled={!draft.enabled}>
            <FieldLegend id="frequency-label">Delivery frequency</FieldLegend>
            <FieldDescription id="frequency-help">{draft.enabled ? "Choose a rhythm that works for you." : "Notifications are off. Your frequency choice is kept for later."}</FieldDescription>
            <RadioGroup value={draft.frequency} disabled={!draft.enabled} aria-labelledby="frequency-label" aria-describedby="frequency-help" className="gap-3 sm:grid-cols-2"
              onValueChange={(frequency) => { if (frequency === "daily" || frequency === "weekly") setDraft({ ...draft, frequency }) }}>
              {(["daily", "weekly"] as const).map((frequency) => (
                <Field key={frequency} orientation="horizontal" data-disabled={!draft.enabled} className="gap-3 rounded-lg border p-4">
                  <RadioGroupItem id={frequency} value={frequency} disabled={!draft.enabled} />
                  <FieldContent>
                    <FieldLabel htmlFor={frequency}>{frequency === "daily" ? "Daily" : "Weekly"}</FieldLabel>
                    <FieldDescription>{frequency === "daily" ? "A little, every day" : "One weekly digest"}</FieldDescription>
                  </FieldContent>
                </Field>
              ))}
            </RadioGroup>
          </FieldSet>
          <div className="flex flex-col gap-3 border-t pt-6 sm:items-end">
            <Button ref={reviewRef} variant="brand" type="submit" aria-haspopup="dialog" className="h-11 px-5">Review changes</Button>
            <p className="text-xs leading-relaxed text-muted-foreground">Changes apply after confirmation. This demo keeps settings only until you reload.</p>
          </div>
        </FieldGroup>
      </form>

      <div role="status" aria-atomic="true" className="mt-6">
        {applied && <section className="rounded-xl border bg-muted/50 p-5">
          <h2 className="font-semibold">Settings applied</h2>
          <p className="mt-2 break-words text-sm leading-relaxed">Email: {applied.email}. Notifications: {applied.enabled ? "On" : "Off"}. Frequency: {applied.frequency === "daily" ? "Daily" : "Weekly"}{applied.enabled ? "." : " (paused)."}</p>
          <p className="mt-2 text-xs text-muted-foreground">Saved for this session. No email is sent.</p>
        </section>}
      </div>

      <Dialog open={pending !== null} onOpenChange={(open) => { if (!open) setPending(null) }}>
        <DialogContent showCloseButton={false} onOpenAutoFocus={(event) => { event.preventDefault(); cancelRef.current?.focus() }} onCloseAutoFocus={(event) => { event.preventDefault(); reviewRef.current?.focus() }}>
          <DialogHeader>
            <DialogTitle>Review your changes</DialogTitle>
            <DialogDescription>Confirm to apply these notification settings for this session.</DialogDescription>
          </DialogHeader>
          {pending && <dl className="grid gap-4 py-2">
            <div><dt className="text-muted-foreground">Email address</dt><dd className="mt-1 break-words font-medium">{pending.email}</dd></div>
            <div><dt className="text-muted-foreground">Email notifications</dt><dd className="mt-1 font-medium">{pending.enabled ? "On" : "Off"}</dd></div>
            <div><dt className="text-muted-foreground">Delivery frequency</dt><dd className="mt-1 font-medium">{pending.frequency === "daily" ? "Daily" : "Weekly"}{!pending.enabled && " (paused)"}</dd></div>
          </dl>}
          <DialogFooter>
            <DialogClose asChild><Button ref={cancelRef} variant="outline" className="h-11">Cancel</Button></DialogClose>
            <Button variant="brand" className="h-11" onClick={() => { if (pending) setApplied({ ...pending }); setPending(null) }}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
