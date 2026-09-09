import { useRef, useState, type FormEvent } from "react"
import { CheckIcon } from "lucide-react"
import { Button } from "~ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~ui/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "~ui/components/ui/dialog"
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldSet, FieldLegend, FieldContent } from "~ui/components/ui/field"
import { Input } from "~ui/components/ui/input"
import { RadioGroup, RadioGroupItem } from "~ui/components/ui/radio-group"
import { Switch } from "~ui/components/ui/switch"

type Preferences = { email: string; notifications: boolean; frequency: "daily" | "weekly" }
const defaults: Preferences = { email: "alex@example.test", notifications: true, frequency: "daily" }
const frequencyLabel = (frequency: Preferences["frequency"]) => frequency === "daily" ? "Daily" : "Weekly"

function Summary({ values }: { values: Preferences }) {
  return (
    <dl className="grid gap-4 rounded-lg bg-muted/50 p-4 text-sm">
      <div className="grid gap-1"><dt className="text-muted-foreground">Email address</dt><dd className="break-all font-medium">{values.email}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Notifications</dt><dd className="font-medium">{values.notifications ? "On" : "Off"}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Frequency</dt><dd className="font-medium">{frequencyLabel(values.frequency)}{!values.notifications && " (paused)"}</dd></div>
    </dl>
  )
}

export function App() {
  const [applied, setApplied] = useState<Preferences>(defaults)
  const [draft, setDraft] = useState<Preferences>({ ...defaults, frequency: "weekly" })
  const [reviewed, setReviewed] = useState<Preferences | null>(null)
  const [open, setOpen] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState("")
  const emailRef = useRef<HTMLInputElement>(null)
  const reviewRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const resultRef = useRef<HTMLHeadingElement>(null)
  const changed = draft.email !== applied.email || draft.notifications !== applied.notifications || draft.frequency !== applied.frequency

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!emailRef.current?.validity.valid) {
      setError(draft.email.trim() ? "Enter a valid email address." : "Email address is required.")
      emailRef.current?.focus()
      return
    }
    setError("")
    if (!changed) return
    setReviewed({ ...draft })
    setOpen(true)
  }

  function confirm() {
    if (!reviewed) return
    setApplied(reviewed)
    setShowResult(true)
    setOpen(false)
  }

  return (
    <main className="min-h-svh bg-muted/30 px-4 py-8 sm:p-16">
      <div className="mx-auto flex w-full max-w-[600px] flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Account / Preferences</p>
          <h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">Notifications</h1>
          <p className="text-sm text-muted-foreground">Make room for the updates you want.</p>
        </header>
        <div className="sr-only" role="status">{showResult ? `Changes applied locally. Notifications ${applied.notifications ? "on" : "off"}. ${frequencyLabel(applied.frequency)} frequency.` : ""}</div>
        <Dialog open={open} onOpenChange={setOpen}>
          {showResult ? (
            <Card className="[--card-spacing:--spacing(6)]">
              <CardHeader className="gap-3">
                <CheckIcon aria-hidden="true" className="size-7" />
                <CardTitle><h2 ref={resultRef} tabIndex={-1} className="text-[22px] outline-none">Changes applied</h2></CardTitle>
                <CardDescription>Your preferences are updated for this local demo.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <Summary values={applied} />
                <Button size="lg" variant="outline" onClick={() => { setDraft({ ...applied }); setShowResult(false) }}>Edit preferences</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="[--card-spacing:--spacing(6)]">
              <CardHeader>
                <div className="grid gap-1 rounded-lg bg-muted/70 p-4">
                  <CardTitle><h2>Email notifications</h2></CardTitle>
                  <CardDescription>Choose what arrives in your inbox.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form noValidate onSubmit={review} className="grid gap-6">
                  <FieldGroup className="gap-6">
                    <Field data-invalid={!!error}>
                      <FieldLabel htmlFor="email">Email address</FieldLabel>
                      <Input ref={emailRef} id="email" name="email" type="email" autoComplete="email" required value={draft.email} aria-invalid={!!error} aria-describedby={error ? "email-help email-error" : "email-help"} className="h-11" onChange={(event) => { setDraft({ ...draft, email: event.currentTarget.value }); setError("") }} />
                      <FieldDescription id="email-help">Used only for this local prototype.</FieldDescription>
                      {error && <FieldError id="email-error">{error}</FieldError>}
                    </Field>
                    <Field orientation="horizontal" className="items-center">
                      <FieldContent>
                        <FieldLabel htmlFor="notifications">Enable notifications</FieldLabel>
                        <FieldDescription id="notifications-help">Turn email updates on or off.</FieldDescription>
                      </FieldContent>
                      <Switch id="notifications" checked={draft.notifications} onCheckedChange={(notifications) => setDraft({ ...draft, notifications })} aria-describedby="notifications-help" />
                    </Field>
                    <FieldSet>
                      <FieldLegend id="frequency-label" variant="label">Frequency</FieldLegend>
                      <RadioGroup aria-labelledby="frequency-label" aria-describedby={!draft.notifications ? "frequency-help" : undefined} value={draft.frequency} disabled={!draft.notifications} onValueChange={(frequency) => { if (frequency === "daily" || frequency === "weekly") setDraft({ ...draft, frequency }) }}>
                        {(["daily", "weekly"] as const).map((frequency) => (
                          <FieldLabel key={frequency} htmlFor={frequency}>
                            <Field orientation="horizontal" data-disabled={!draft.notifications}>
                              <RadioGroupItem id={frequency} value={frequency} disabled={!draft.notifications} />
                              <span>{frequencyLabel(frequency)}</span>
                            </Field>
                          </FieldLabel>
                        ))}
                      </RadioGroup>
                      {!draft.notifications && <FieldDescription id="frequency-help">Frequency is paused while notifications are off. Your selection is kept.</FieldDescription>}
                    </FieldSet>
                  </FieldGroup>
                  <Button ref={reviewRef} type="submit" variant="brand" size="lg" disabled={!changed}>Review changes</Button>
                  {!changed && <p role="status" className="text-center text-sm text-muted-foreground">No changes to review.</p>}
                </form>
              </CardContent>
            </Card>
          )}
          <DialogContent showCloseButton={false} initialFocus={cancelRef} finalFocus={false} className="max-h-[calc(100svh-2rem)] gap-6 overflow-y-auto p-6 sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-[22px]">Review changes</DialogTitle>
              <DialogDescription>Confirm these preferences for this local demo. No email will be sent.</DialogDescription>
            </DialogHeader>
            {reviewed && <>
              <Summary values={reviewed} />
              {reviewed.frequency !== applied.frequency && <p className="text-sm text-muted-foreground">Frequency: {frequencyLabel(applied.frequency)} → {frequencyLabel(reviewed.frequency)}</p>}
            </>}
            <DialogFooter className="m-0 flex-col rounded-none border-0 bg-transparent p-0 sm:flex-row">
              <DialogClose render={<Button ref={cancelRef} variant="outline" size="lg" />}>Cancel</DialogClose>
              <Button size="lg" variant="brand" onClick={confirm}>Confirm changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <p className="text-center text-xs text-muted-foreground">Local demo · No email is sent. Reload resets preferences.</p>
      </div>
    </main>
  )
}

export default App
