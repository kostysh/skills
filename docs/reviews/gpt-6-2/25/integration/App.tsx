import { useRef, useState, type SubmitEvent } from "react"
import { Link, useLoaderData } from "react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Tooltip } from "./components/Tooltip.js"
import { saveSettings, type Settings } from "./notification-api"
import { settingsQuery } from "./notification-query"
import { Button } from "~ui/components/ui/button"
import { Input } from "~ui/components/ui/input"
import { Switch } from "~ui/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "~ui/components/ui/radio-group"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "~ui/components/ui/field"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~ui/components/ui/dialog"

export default function App() {
  const initial = useLoaderData<Settings | null>()
  const client = useQueryClient()
  const write = useMutation({ mutationFn: saveSettings, retry: false })
  const [unverified, setUnverified] = useState<Settings | null>(null)
  const [draft, setDraft] = useState<Settings>(initial ?? { email: "", enabled: true, frequency: "daily" })
  const [pending, setPending] = useState<Settings | null>(null)
  const [applied, setApplied] = useState<Settings | null>(initial)
  const [error, setError] = useState("")
  const emailRef = useRef<HTMLInputElement>(null)
  const reviewRef = useRef<HTMLButtonElement>(null)
  const dismissRef = useRef<HTMLButtonElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const [applying, setApplying] = useState(false)
  const [notice, setNotice] = useState("")
  async function verifyApplied(submitted: Settings) {
    setApplying(true)
    try {
      const saved = await client.query(settingsQuery)
      if (!saved || saved.email !== submitted.email || saved.enabled !== submitted.enabled || saved.frequency !== submitted.frequency) {
        throw new Error("The saved values differ.")
      }
      setApplied(saved)
      setUnverified(null)
      setNotice("")
    } catch {
      setUnverified(submitted)
      setNotice("The write was accepted. The saved settings could not be verified.")
    } finally {
      setApplying(false)
      setPending(null)
    }
  }

  async function applySettings() {
    if (!pending || applying) return
    const submitted = { ...pending }
    dismissRef.current?.focus()
    setUnverified(null)
    setApplying(true)
    setNotice("Applying changes…")
    try {
      await write.mutateAsync(submitted)
    } catch {
      setNotice("Settings could not be saved. Review your changes and try again.")
      setApplying(false)
      setPending(null)
      return
    }
    await verifyApplied(submitted)
  }

  function dismissReview() {
    setPending(null)
  }

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
        <Link to="/" className="mb-3 block text-sm font-medium text-muted-foreground">Preferences</Link>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Notification settings</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">Choose where and how often you hear from us.</p>
        <Tooltip label="Review your changes before you confirm.">About these settings</Tooltip>
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
            <Button ref={reviewRef} disabled={applying} variant="brand" type="submit" aria-haspopup="dialog" className="h-11 px-5">Review changes</Button>
            <p className="text-xs leading-relaxed text-muted-foreground">Confirm to save these settings. You can reopen this page to read them.</p>
          </div>
        </FieldGroup>
      </form>

      <div ref={resultRef} role="status" aria-atomic="true" tabIndex={-1}
        className="mt-6 space-y-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
        {notice && <p className="rounded-lg border-s-4 border-primary bg-muted px-4 py-3 text-sm font-medium">{notice}</p>}
        {unverified && <Button type="button" variant="outline" disabled={applying}
          onClick={() => verifyApplied(unverified)}>Check saved settings again</Button>}
        {applied && <section className="rounded-xl border bg-muted/50 p-5">
          <h2 className="font-semibold">{notice ? "Previously applied settings" : "Settings applied"}</h2>
          <p className="mt-2 break-words text-sm leading-relaxed">Email: {applied.email}. Notifications: {applied.enabled ? "On" : "Off"}. Frequency: {applied.frequency === "daily" ? "Daily" : "Weekly"}{applied.enabled ? "." : " (paused)."}</p>
          <p className="mt-2 text-xs text-muted-foreground">Read from the local settings service. No email is sent.</p>
        </section>}
      </div>

      <Dialog open={pending !== null} onOpenChange={(open) => { if (!open) dismissReview() }}>
        <DialogContent showCloseButton={false}
          onOpenAutoFocus={(event) => { event.preventDefault(); dismissRef.current?.focus() }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            if (reviewRef.current?.disabled) resultRef.current?.focus()
            else reviewRef.current?.focus()
          }}>
          <DialogHeader>
            <DialogTitle>{applying ? "Applying changes" : "Review your changes"}</DialogTitle>
            <DialogDescription>{applying
              ? "You can close this window. Your changes will continue to apply."
              : "Confirm to save these notification settings."}</DialogDescription>
          </DialogHeader>
          {pending && <dl className="grid gap-4 py-2">
            <div><dt className="text-muted-foreground">Email address</dt><dd className="mt-1 break-words font-medium">{pending.email}</dd></div>
            <div><dt className="text-muted-foreground">Email notifications</dt><dd className="mt-1 font-medium">{pending.enabled ? "On" : "Off"}</dd></div>
            <div><dt className="text-muted-foreground">Delivery frequency</dt><dd className="mt-1 font-medium">{pending.frequency === "daily" ? "Daily" : "Weekly"}{!pending.enabled && " (paused)"}</dd></div>
          </dl>}
          <DialogFooter>
            <DialogClose asChild><Button ref={dismissRef} variant={applying ? "brand" : "outline"} className="h-11 transition-none">
              {applying ? "Close" : "Cancel"}
            </Button></DialogClose>
            <Button variant={applying ? "outline" : "brand"} className="h-11 transition-none" disabled={applying} onClick={applySettings}>{applying ? "Applying…" : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
