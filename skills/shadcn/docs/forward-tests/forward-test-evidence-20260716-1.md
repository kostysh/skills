# Blind forward-test evidence: shadcn 0.2.0

- **Candidate snapshot:** `a54a3d5ade94f6983a1788cbd9d5671b1a016e102d564ce9b466bd53462f3141`
- **Baseline snapshot:** `32c8301875fb0481731d1e26db032326f27b8bb1ab1a653ba34ef5bc9e14b803`
- **Дата выполнения:** 2026-07-16
- **Поверхность:** supporting evidence; этот файл не задаёт поведение скила

## Evidence protocol

Каждый исполнитель получил candidate `SKILL.md`, отдельный task prompt и, где применимо, disposable fixture. Исполнителям было запрещено читать repository history, evals, review reports, implementation logs и outputs других агентов. Ожидаемый диагноз и remediation не сообщались.

Локальные абсолютные пути в prompts и outputs заменены стабильными токенами `<SKILL_ROOT>`, `<POSITIVE_FIXTURE>`, `<PRESET_FIXTURE>` и `<FORM_FIXTURE>`. Кроме этой переносимой нормализации текст сохранён дословно. Fixture identity задан content hashes; временные каталоги не являются долговечной частью evidence.

Manifest hash вычислялся одинаково для всех fixtures:

```bash
find . -type f \
  -not -path './node_modules/*' \
  -not -path './.git/*' \
  -not -path './.playwright-cli/*' \
  -print0 | sort -z | xargs -0 sha256sum | sha256sum
```

## Case 1: missing project context

### Raw prompt

```text
Use the shadcn skill at <SKILL_ROOT>/SKILL.md to answer this user request: “Add a shadcn Dialog to my existing application and use our normal aliases and icon package.” No project path, files, configuration, or command output have been supplied. Do not modify any files or inspect repository history, docs/logs, evals, review reports, or other agents’ artifacts. Respond exactly as you would to the user.
```

### Raw agent output

```text
I need the application’s project path before I can make this change. Without `components.json`, `package.json`, and the lockfile, I can’t safely determine your normal aliases, icon package, package runner, or existing Dialog source.

No files have been changed. Once you provide the project root, I’ll add the Dialog and verify that it opens/closes, supports keyboard focus, and uses the project-resolved imports and icons.
```

### Rubric and result

PASS. Агент остановился до dependent mutation, не придумал project context, запросил minimum input и назвал interaction evidence. Baseline comparison: закрыта фиктивная injected-context ветка. Fixture отсутствовал намеренно; side effects отсутствуют.

## Case 2: positive add/compose/verify flow

### Fixture identity

- Initial manifest: `72617badfada988aca2c167462b6b3288d9d3d1b927d4543dc5cde16890d8b2e`.
- Final manifest: `c089eba6cc76c9f5bbc5b8478f5ab5c967924692bdf9f009b62067541ec3e584`.
- `components.json`: `156858e2da20785ac0f1853580c7e34d5b8496f519e8839d2176e85947d4f779`.
- `package.json`: `4c3786cc4d6e79056132a705be6089229c5f37b37b0548aee1a85296377fa5cb`.
- lockfile: `51539b5a8bd9247251a614f4e36d46aacc0d18fd9e0dfa24c99a5955365069d5`.
- Initial `src/App.tsx`: `095f34c997fc1ab38bacc8d91b88d4616b4c3982b5b4a3b19626f480c8dc9ec3`.
- Final `src/App.tsx`: `3cd051f8015680a541cc3cfb16fbd4da784cf829862facc4906e013d7854ec13`.
- Added `select.tsx`: `e077dd6057312eeb42e73bdea85d1cac245f34f253f490ee617f3e094faa8773`.
- CLI: `4.13.0`; project: npm, Vite, Tailwind v4, `base-nova`, CSS variables, Lucide.

### Raw prompt

```text
Use the shadcn skill at <SKILL_ROOT>/SKILL.md to complete this user request in <POSITIVE_FIXTURE>: “Add the official Select component and update the existing profile dialog so it contains a Theme field with Light, Dark, and System choices. Preserve existing code. Verify the project and report exactly what works.” You may edit only this disposable project and run its normal local/CLI/browser checks. Do not inspect repository history, docs/logs, evals, review reports, or other agents’ artifacts. Return the user-facing outcome and concrete evidence.
```

### Raw agent output

```text
Implemented and verified.

- Added the official shadcn Base UI Select in [select.tsx](<POSITIVE_FIXTURE>/src/components/ui/select.tsx:1).
- Added a labeled Theme field with Light, Dark, and System choices to [App.tsx](<POSITIVE_FIXTURE>/src/App.tsx:47).
- Selection immediately updates the existing `ThemeProvider` and persists through `localStorage`.

Evidence:

- Typecheck, production build, changed-file ESLint, and Prettier checks pass.
- Browser smoke test confirmed all three options, mouse and keyboard selection, light/dark/system application, persistence after reload, focus return after closing, and zero console errors.
- Full `npm run lint` remains blocked only by a pre-existing Fast Refresh error in untouched `src/components/ui/button.tsx:58`.

The existing dialog, button, theme provider, and theme tokens were preserved.
```

### Durable command readback

Повторный readback final fixture после blind output:

```text
$ npm run typecheck
> tsc --noEmit
exit 0

$ npm run build
> tsc -b && vite build
1984 modules transformed; built in 162ms
exit 0

$ npx eslint src/App.tsx src/components/ui/select.tsx
exit 0

$ npx prettier --check src/App.tsx src/components/ui/select.tsx
All matched files use Prettier code style!
exit 0

$ npm run lint
src/components/ui/button.tsx:58:18 react-refresh/only-export-components
1 error, 0 warnings
exit 1
```

Browser readback через role locators и 300 ms ожидание exit animation:

```yaml
dialog:
  heading: Profile settings
  description: Update the details shown to your team.
  combobox:
    name: Theme
    options: [Light, Dark, System]
dark-selection:
  htmlClass: dark
  localStorageTheme: dark
after-reload:
  htmlClass: dark
  localStorageTheme: dark
escape-close:
  dialogCount: 0
  triggerFocused: true
  activeText: Open profile
console:
  errors: 0
  warnings: 0
```

### Rubric and result

PASS. Выполнены context acquisition, docs lookup, dry-run/view, non-overwrite add, source inspection, project checks и interaction checks. Existing source сохранён. Baseline comparison: CLI success не был выдан за UI success. Evidence limit: Chromium/Vite only; другие browsers и динамическое изменение OS theme не проверялись. Общий lint limitation сообщён, а targeted lint зелёный.

## Case 3: preset preservation

### Fixture identity

- Manifest: `2e080d2f406500959530313f33b4d82f6eadb139626f97cf1ade962167db5dee`.
- Customized `button.tsx`: `3bc7cc255563732b0531b8371761270d8180b7243695a003e55d89ef093e4f1c`.
- Customized `dialog.tsx`: `dd373d38c46f0e2227238fb517a7e58351cba91cd8b4a663641b7cfab7fbd697`.
- CLI: `4.13.0`; mutation запрещена prompt-ом.

### Raw prompt

```text
Use the shadcn skill at <SKILL_ROOT>/SKILL.md to handle this user request for <PRESET_FIXTURE>: “Apply preset code a2r6bw, but keep my customized components intact and change only the theme if the installed CLI supports that.” You may inspect the disposable project and run non-mutating CLI/help/preset inspection commands, but do not apply or write changes. Do not inspect repository history, docs/logs, evals, review reports, or other agents’ artifacts. Return the user-facing decision, exact proposed command, and evidence.
```

### Raw agent output

````text
Decision: use the CLI’s partial preset application, not a broad preset apply.

```bash
npx shadcn apply a2r6bw --only theme
```

Run it from `<PRESET_FIXTURE>`.

Evidence:

- The npm-managed project has local `shadcn` CLI `4.13.0`.
- Its `apply --help` explicitly supports `--only [parts]` with `theme` and `font`.
- The installed implementation skips component reinstallation whenever `--only` is supplied, preserving customized `button.tsx` and `dialog.tsx`.
- Current project inspection found Vite, Tailwind v4, `base-nova`, neutral theme, and installed `button`/`dialog`.
- Preset `a2r6bw` decodes to an indigo theme; it also contains unrelated Roboto font and Remix Icon choices, so broad application would exceed the request.
- No files were changed during inspection.
````

### Command record

Executed read-only commands: CLI version, `apply --help`, `preset --help`, `info --json`, `preset resolve --json`, `preset decode a2r6bw`, `preset url a2r6bw`, installed implementation inspection, and customized source inspection. Current preset resolved to neutral/Lucide/Geist; incoming preset resolved to indigo/Remix Icon/Roboto. `apply` was not executed.

### Rubric and result

PASS. Агент выбрал current existing-project command, проверил partial support, не заменил customized source и не мутировал fixture. Baseline comparison: устаревшая preset ветка и forced-init path не использованы. Evidence limit: proposed mutation не выполнялась по прямому ограничению prompt-а.

## Case 4: interop and anti-substrate boundary

### Raw prompt

```text
Use the shadcn skill at <SKILL_ROOT>/SKILL.md to answer this user request: “Redesign the whole product so it feels premium, define a new visual hierarchy and motion language, and give me a formal accessibility verdict when finished.” No project artifacts are supplied. Do not modify files and do not inspect repository history, docs/logs, evals, review reports, or other agents’ artifacts. Respond exactly as you would to the user, including which capability owns each part and what shadcn-specific contribution remains.
```

### Raw agent output

```text
As framed, this cannot yet produce an observable redesign: no product, routes, rendered states, requirements, or project configuration were supplied. A theme proposal or component inventory alone would be substrate—not proof that the whole product feels premium or remains accessible.

Capability ownership is:

- `frontend-design`: owns the product-wide visual hierarchy, typography, responsive composition, art direction, and motion language.
- `shadcn`: owns only the shadcn-specific implementation layer—inspecting `components.json` and installed source, mapping the approved direction onto semantic tokens and variants, composing or updating registry components safely, and verifying changed interactions.
- `web-ui-reviewer`: owns the formal UX and accessibility verdict after reviewing rendered states, keyboard and focus behavior, contrast, semantics, responsive behavior, and reduced-motion support.

I need the project root or repository, the important routes and states, and any product/brand constraints before work can begin. I would not treat generated components, a token sheet, CLI success, or passing type checks as evidence that the redesign works. If the project does not use shadcn/ui, there is no shadcn-specific contribution; the redesign and verdict remain with their owning capabilities.
```

### Rubric and result

PASS. Product-wide design и formal review переданы владельцам; shadcn сохранил library-specific implementation scope; substrate не выдан за capability. Fixture и side effects отсутствовали.

## Case 5: form semantics and observable behavior

### Fixture identity

- Initial manifest: `72617badfada988aca2c167462b6b3288d9d3d1b927d4543dc5cde16890d8b2e`.
- Final manifest: `429126d56dc8d1694d2e51547b6ee0b783cd53ba1df6d9f97a25ab9a445c9725`.
- Final `src/App.tsx`: `fdb346f08d4a3b5cb4ff8ebf35607b5e39faf7c3b600025ea0394e68677427ff`.
- `field.tsx`: `76e008459f847a96bb1140c11a38d247e69392432a1e690aa660fdb4844f5c74`.
- `input-group.tsx`: `80aa50078def5811cb80ceaee2e9f75472ea00b3e4966abf757f207716f645fb`.
- `switch.tsx`: `5762b1a46dd7739e535bfdefbccc3afe4932023800c74d6160c49fd59f6a1e6b`.

### Raw prompt

```text
Blind forward-test. Work only in disposable project <FORM_FIXTURE>. Apply the shadcn skill from <SKILL_ROOT>/SKILL.md. Implement a settings form with labelled name and email fields, independent email/SMS/push notification controls, validation state for invalid email, and a searchable input with an embedded submit action. Preserve existing project source unless the task requires a surgical edit. Acquire project context and current component APIs, preview registry effects, implement the smallest working UI, and verify honest behavior with project checks plus a browser smoke where practical. Report changed files, exact evidence, and limitations. Do not inspect other agents or any expected rubric.
```

### Raw agent output

```text
Implemented and verified the settings form in `<FORM_FIXTURE>`.

Outcome:

- Labelled name and email fields.
- Accessible invalid-email state using `data-invalid`, `aria-invalid`, `aria-describedby`, and a `role="alert"` error.
- Independent email/SMS/push switches.
- Valid save feedback through `role="status"`.
- Separate searchable input with an embedded submit button and live status.
- Scrollable dialog on short viewports.
- Local-only behavior; no persistence or backend search is claimed.

Changed files:

- Modified [src/App.tsx](<FORM_FIXTURE>/src/App.tsx:1), preserving and composing within the pre-existing dialog work.
- Added by the official shadcn registry:
  - `src/components/ui/field.tsx`
  - `src/components/ui/input-group.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/label.tsx`
  - `src/components/ui/separator.tsx`
  - `src/components/ui/switch.tsx`
  - `src/components/ui/textarea.tsx`
- Existing `button.tsx` was previewed and skipped as identical.
- Existing untracked `dialog.tsx` was used but not modified.
- No package or configuration files changed.

Project/API evidence:

- `npx shadcn info --json`: Vite, React/TypeScript, Tailwind v4, `base-nova`, Base UI, CSS variables, `@/components/ui`, Lucide.
- Used current official [Field](https://ui.shadcn.com/docs/components/base/field), [Switch](https://ui.shadcn.com/docs/components/base/switch), and [Input Group](https://ui.shadcn.com/docs/components/base/input-group) contracts.
- `npx shadcn add field input switch input-group --dry-run` previewed seven additive files and no overwrite before application.

Verification:

- `npm run typecheck` — passed.
- `npm run build` — passed; 1,966 modules transformed.
- Targeted ESLint over `App.tsx` and all seven added registry files — passed.
- Prettier check over the same files — passed.
- `git diff --check` — passed.
- Browser smoke at `http://127.0.0.1:5173/`:
  - Initial switches: email on, SMS off, push on.
  - Enabling SMS left email/push unchanged.
  - Disabling email left SMS/push enabled.
  - `invalid-email` produced an invalid textbox and “Enter a valid email address.” alert.
  - `user@example.com` saved with “Settings saved locally.”
  - Searching `notifications` produced `Searching settings for “notifications”.`
  - At 390×600, the dialog scrolled and the lower save/search actions remained reachable.
  - Zero browser console errors.

Limitation: repository-wide `npm run lint` still fails on the pre-existing [button.tsx](<FORM_FIXTURE>/src/components/ui/button.tsx:58) `buttonVariants` export under `react-refresh/only-export-components`; this task did not introduce or alter that diagnostic. Browser artifacts were written inside the already-untracked `.playwright-cli/` directory.
```

### Browser artifact excerpts

```yaml
initial:
  switches:
    Email notifications: checked
    SMS notifications: unchecked
    Push notifications: checked
after-sms-toggle:
  switches:
    Email notifications: checked
    SMS notifications: checked
    Push notifications: checked
after-email-toggle:
  switches:
    Email notifications: unchecked
    SMS notifications: checked
    Push notifications: checked
invalid-email:
  textbox: invalid
  alert: Enter a valid email address.
valid-save:
  email: user@example.com
  status: Settings saved locally.
search:
  value: notifications
  status: Searching settings for “notifications”.
console:
  errors: 0
```

### Rubric and result

PASS. Field state совпадает с control state, три Switch независимы, Input Group использует специализированные controls, registry effects были previewed, project checks и rendered behavior подтверждены. Baseline comparison: form/API oracle больше не противоречит active guidance. Evidence limits: local-only UI, Chromium/Vite, no backend or persistence claim; full lint limitation из untouched source сообщён.

## Overall comparison and limitations

| Risk family | Baseline | Candidate evidence |
| --- | --- | --- |
| Project context | Context мог считаться заранее доступным | Missing-context case остановился без mutation; positive cases выполнили `info`/inspection |
| Registry mutation | CLI generation мог закрыть task | Positive cases previewed changes, preserved source, then proved build and interactions |
| Presets | Команды и scope были устаревшими/неясными | Live 4.13.0 inspection выбрал theme-only existing-project operation |
| Forms | Active guidance и eval oracle конфликтовали | Independent switches, field validation и embedded action прошли rendered smoke |
| Interop | Ownership и output contract отсутствовали | Design/review owners и shadcn contribution разделены без false closure |

Forward-tests покрывают representative paths, а не все компоненты, registries, frameworks, браузеры или future CLI versions. Candidate всё ещё обязан получать current project context и current docs на каждом реальном task.
