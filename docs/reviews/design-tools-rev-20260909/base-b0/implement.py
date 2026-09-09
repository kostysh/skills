from pathlib import Path
root = Path('/tmp/design-tools-rev-20260909/live-base-b0')
p = root / 'src/components/ui/button.tsx'
s = p.read_text()
s = s.replace('focus-visible:border-ring focus-visible:ring-ring/50', 'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50')
p.write_text(s)
(root / 'src/App.tsx').write_text('''import { useRef, useState, type FormEvent } from "react"
import { Bell, Check } from "lucide-react"
import { Button } from "~ui/components/ui/button"
import { Input } from "~ui/components/ui/input"
import { Switch } from "~ui/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "~ui/components/ui/radio-group"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "~ui/components/ui/field"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~ui/components/ui/dialog"

type Settings = { email: string; enabled: boolean; frequency: "daily" | "weekly" }

export function App() {
  const [draft, setDraft] = useState<Settings>({ email: "", enabled: true, frequency: "daily" })
  const [error, setError] = useState("")
  const [pending, setPending] = useState<Settings | null>(null)
  const [applied, setApplied] = useState<Settings | null>(null)
  const [open, setOpen] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const reviewRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!emailRef.current?.validity.valid) {
      setError(draft.email.trim() ? "Enter a valid email address." : "Email is required.")
      emailRef.current?.focus()
      return
    }
    setError("")
    setPending({ ...draft, email: draft.email.trim() })
    setOpen(true)
  }

  return (
    <main className="min-h-svh bg-muted/30 px-5 py-10 sm:py-20">
      <div className="mx-auto max-w-xl">
        <header className="mb-8">
          <div className="mb-5 flex size-11 items-center justify-center rounded-xl border bg-background"><Bell aria-hidden="true" className="size-5" /></div>
          <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">Preferences</p>
          <h1 className="text-3xl font-semibold tracking-tight">Notification settings</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Choose where and how often you hear from us.</p>
        </header>
        <form noValidate onSubmit={review} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="email">Email address <span className="font-normal text-muted-foreground">(required)</span></FieldLabel>
              <Input ref={emailRef} id="email" name="email" type="email" autoComplete="email" required value={draft.email} onChange={(event) => { setDraft({ ...draft, email: event.target.value }); setError("") }} aria-invalid={!!error} aria-describedby={error ? "email-help email-error" : "email-help"} placeholder="you@example.com" className="h-11" />
              <FieldDescription id="email-help">Your preferred address for notification updates.</FieldDescription>
              {error && <FieldError id="email-error">{error}</FieldError>}
            </Field>
            <Field orientation="horizontal" className="border-y py-5">
              <FieldContent>
                <FieldLabel htmlFor="notifications">Notifications</FieldLabel>
                <FieldDescription id="notifications-help">Receive updates at your chosen frequency.</FieldDescription>
              </FieldContent>
              <Switch id="notifications" checked={draft.enabled} onCheckedChange={(enabled) => setDraft({ ...draft, enabled })} aria-describedby="notifications-help" />
            </Field>
            <FieldSet>
              <FieldLegend id="frequency-label" variant="label">Delivery frequency</FieldLegend>
              <RadioGroup value={draft.frequency} onValueChange={(value) => { if (value === "daily" || value === "weekly") setDraft({ ...draft, frequency: value }) }} disabled={!draft.enabled} aria-labelledby="frequency-label" aria-describedby="frequency-help" className="grid gap-3 sm:grid-cols-2">
                {(["daily", "weekly"] as const).map((frequency) => (
                  <Field key={frequency} orientation="horizontal" data-disabled={!draft.enabled} className="rounded-lg border px-4 py-3">
                    <RadioGroupItem id={frequency} value={frequency} />
                    <FieldLabel htmlFor={frequency} className="py-1">{frequency === "daily" ? "Daily" : "Weekly"}</FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
              <FieldDescription id="frequency-help">{draft.enabled ? "Choose one schedule for your updates." : "Turn notifications on to change the frequency."}</FieldDescription>
            </FieldSet>
            <Button ref={reviewRef} type="submit" variant="brand" size="lg" className="mt-2 h-11 w-full">Review changes</Button>
          </FieldGroup>
        </form>
        <div role="status" aria-atomic="true" className="mt-5">
          {applied && <section className="rounded-xl border bg-background p-5 text-sm">
            <p className="mb-2 flex items-center gap-2 font-medium"><Check aria-hidden="true" className="size-4" />Settings applied</p>
            <p className="break-words text-muted-foreground">{applied.email}</p>
            <p className="mt-1 text-muted-foreground">Notifications {applied.enabled ? "on" : "off"} · {applied.enabled ? (applied.frequency === "daily" ? "Daily delivery" : "Weekly delivery") : `Delivery paused (${applied.frequency} preference retained)`}</p>
          </section>}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">Demo settings stay in this page. No emails are sent.</p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent initialFocus={cancelRef} finalFocus={reviewRef} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Review notification settings</DialogTitle>
            <DialogDescription>Confirm to apply these preferences to this page.</DialogDescription>
          </DialogHeader>
          {pending && <dl className="grid gap-4 py-2">
            <div><dt className="text-muted-foreground">Email address</dt><dd className="mt-1 break-words font-medium">{pending.email}</dd></div>
            <div><dt className="text-muted-foreground">Notifications</dt><dd className="mt-1 font-medium">{pending.enabled ? "On" : "Off"}</dd></div>
            <div><dt className="text-muted-foreground">Delivery frequency</dt><dd className="mt-1 font-medium">{pending.frequency === "daily" ? "Daily" : "Weekly"}{!pending.enabled && " (paused)"}</dd></div>
          </dl>}
          <DialogFooter>
            <DialogClose render={<Button ref={cancelRef} variant="outline" />}>Cancel</DialogClose>
            <Button onClick={() => { if (pending) { setApplied(pending); setOpen(false) } }}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default App
''')
