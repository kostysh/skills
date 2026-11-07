# Supplemental environment-guided verification

Дополнительная проверка выполнена по конкретному ограничению исходного dev-прогона: Vite запрещал font asset через symlink/allowlist. Использован уже собранный production build и объявленный `pnpm preview`, без правок config/dependencies. Исходные функциональные сценарии не повторялись; проверены packaged font и narrow form/modal. Исходные blind/dev материалы сохранены без изменений.

## 1

```bash
env pnpm_config_pm_on_fail=ignore pnpm_config_manage_package_manager_versions=false pnpm_config_verify_deps_before_run=false pnpm preview --host 127.0.0.1 --port 4318 --strictPort
```

Exit: running; session 81443

```text
$ vite preview --host 127.0.0.1 --port 4318 --strictPort
(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite:
  - `__dirname` (vite.config.ts:11:27). Use `import.meta.dirname` instead
Set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress this warning.
  ➜  Local:   http://127.0.0.1:4318/

```

## 2

```bash
env XDG_RUNTIME_DIR=/tmp/webux-live-b-runtime XDG_CONFIG_HOME=/tmp/webux-live-b-config agent-browser --config /tmp/web-ux-20261107-xaye7ceb/candidate/live-results/browser-config.json --session webux-live-b --profile /tmp/webux-live-b-profile --auto-connect false --headed false --args '--no-sandbox' open http://127.0.0.1:4318/
```

Exit: 0

```text
✓ vite-app
  http://127.0.0.1:4318/

```

## 3

```bash
env XDG_RUNTIME_DIR=/tmp/webux-live-b-runtime XDG_CONFIG_HOME=/tmp/webux-live-b-config agent-browser --config /tmp/web-ux-20261107-xaye7ceb/candidate/live-results/browser-config.json --session webux-live-b --profile /tmp/webux-live-b-profile --auto-connect false --headed false --args '--no-sandbox' batch --bail 'set viewport 320 720' 'wait --load networkidle' 'snapshot -i' 'fill #email narrow@example.test' 'click #weekly' 'wait --fn '\''document.querySelector('\''\'\'''\''#weekly'\''\'\'''\'').getAttribute('\''\'\'''\''aria-checked'\''\'\'''\'') === '\''\'\'''\''true'\''\'\'''\'''\''' 'click #notifications' 'wait --fn '\''document.querySelector('\''\'\'''\''#notifications'\''\'\'''\'').getAttribute('\''\'\'''\''aria-checked'\''\'\'''\'') === '\''\'\'''\''false'\''\'\'''\'' && document.fonts.status === '\''\'\'''\''loaded'\''\'\'''\'''\''' 'snapshot' 'eval '\''JSON.stringify({fontFamily:getComputedStyle(document.body).fontFamily,loadedFonts:Array.from(document.fonts).filter(f=>f.status==='\''\'\'''\''loaded'\''\'\'''\'').map(f=>({family:f.family,status:f.status,weight:f.weight})),fontRequests:performance.getEntriesByType('\''\'\'''\''resource'\''\'\'''\'').filter(r=>r.name.includes('\''\'\'''\''.woff2'\''\'\'''\'')).map(r=>({name:r.name,responseStatus:r.responseStatus,transferSize:r.transferSize})),viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth,email:document.querySelector('\''\'\'''\''#email'\''\'\'''\'').value})'\''' 'screenshot /tmp/web-ux-20261107-xaye7ceb/candidate/live-results/screenshots/08-preview-packaged-font-narrow-form.png --full' 'find role button click --name '\''Review changes'\''' 'wait --fn '\''document.querySelector('\''\'\'''\''[role="dialog"]'\''\'\'''\'')?.textContent.includes('\''\'\'''\''narrow@example.test'\''\'\'''\'') && getComputedStyle(document.querySelector('\''\'\'''\''[role="dialog"]'\''\'\'''\'')).opacity === '\''\'\'''\''1'\''\'\'''\'''\''' 'snapshot' 'eval '\''JSON.stringify({dialog:document.querySelector('\''\'\'''\''[role="dialog"]'\''\'\'''\'').textContent,rect:document.querySelector('\''\'\'''\''[role="dialog"]'\''\'\'''\'').getBoundingClientRect().toJSON(),focus:document.activeElement.textContent,viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth})'\''' 'screenshot /tmp/web-ux-20261107-xaye7ceb/candidate/live-results/screenshots/09-preview-packaged-font-narrow-dialog.png' 'network requests' 'errors' 'console'
```

Exit: 0

```text
⚠ --profile, --args, --headed ignored: daemon already running. Use 'agent-browser close' first to restart with new options.
✓ Done

✓ Done

- generic "PreferencesNotification settingsChoose where and how often you hear from us.Email address (required)" [ref=e1] clickable [onclick]
  - heading "Notification settings" [level=1, ref=e2]
  - textbox "Email address (required)" [required, ref=e5]
  - switch "Email notifications" [checked=true, ref=e6]
  - radiogroup "Delivery frequency" [ref=e7] focusable [tabindex]
    - radio "Daily" [checked=true, ref=e8]
    - radio "Weekly" [checked=false, ref=e9]
  - button "Discard changes" [disabled, ref=e3]
  - button "Review changes" [ref=e4]

✓ Done

✓ Done

true

✓ Done

true

- generic [ref=e1] clickable [onclick]
  - main
    - sectionheader
      - paragraph
        - StaticText "Preferences"
      - heading "Notification settings" [level=1, ref=e2]
      - paragraph
        - StaticText "Choose where and how often you hear from us."
    - form
      - group
        - LabelText
          - StaticText "Email address"
          - StaticText "(required)"
        - textbox "Email address (required)" [required, ref=e5]: narrow@example.test
          - StaticText "narrow@example.test"
        - paragraph
          - StaticText "Your preferred address for notification emails."
      - group
        - LabelText
          - StaticText "Email notifications"
        - paragraph
          - StaticText "Turn updates on or pause them at any time."
        - switch "Email notifications" [checked=false, ref=e6]
      - group "Delivery frequency"
        - Legend
          - StaticText "Delivery frequency"
        - paragraph
          - StaticText "Notifications are off. Your frequency choice is kept for later."
        - radiogroup "Delivery frequency"
          - group
            - radio "Daily" [checked=false, disabled, ref=e7]
            - LabelText
              - StaticText "Daily"
            - paragraph
              - StaticText "A little, every day"
          - group
            - radio "Weekly" [checked=true, disabled, ref=e8]
            - LabelText
              - StaticText "Weekly"
            - paragraph
              - StaticText "One weekly digest"
      - button "Discard changes" [ref=e3]
      - button "Review changes" [ref=e4]
      - paragraph
        - StaticText "Discard restores the initial settings."
      - paragraph
        - StaticText "Changes apply after confirmation. This demo keeps settings only until you reload."
      - status
    - status

"{\"fontFamily\":\"\\\"Geist Variable\\\", sans-serif\",\"loadedFonts\":[{\"family\":\"Geist Variable\",\"status\":\"loaded\",\"weight\":\"100 900\"}],\"fontRequests\":[{\"name\":\"http://127.0.0.1:4318/assets/geist-latin-wght-normal-BgDaEnEv.woff2\",\"responseStatus\":200,\"transferSize\":29700}],\"viewport\":{\"width\":320,\"height\":720},\"scrollWidth\":320,\"email\":\"narrow@example.test\"}"

✓ Screenshot saved to /tmp/web-ux-20261107-xaye7ceb/candidate/live-results/screenshots/08-preview-packaged-font-narrow-form.png

✓ Done

true

- generic
  - dialog "Review your changes"
    - heading "Review your changes" [level=2, ref=e1]
    - paragraph
      - StaticText "Confirm to apply these notification settings for this session."
    - DescriptionList
      - term "Email address"
      - definition
        - StaticText "narrow@example.test"
      - term "Email notifications"
      - definition
        - StaticText "Off"
      - term "Delivery frequency"
      - definition
        - StaticText "Weekly (paused)"
    - button "Cancel" [ref=e2]
    - button "Confirm" [ref=e3]

"{\"dialog\":\"Review your changesConfirm to apply these notification settings for this session.Email addressnarrow@example.testEmail notificationsOffDelivery frequencyWeekly (paused)CancelConfirm\",\"rect\":{\"x\":16,\"y\":149.5,\"width\":288,\"height\":421,\"top\":149.5,\"right\":304,\"bottom\":570.5,\"left\":16},\"focus\":\"Cancel\",\"viewport\":{\"width\":320,\"height\":720},\"scrollWidth\":320}"

✓ Screenshot saved to /tmp/web-ux-20261107-xaye7ceb/candidate/live-results/screenshots/09-preview-packaged-font-narrow-dialog.png

[4D39C54FFF08F5FD18C71F083E0C7CF6] GET http://127.0.0.1:4318/ (Document) 200
[148581.2] GET http://127.0.0.1:4318/assets/index-CzQSlqtv.js (Script) 200
[148581.3] GET http://127.0.0.1:4318/assets/index-DZRSrmZ3.css (Stylesheet) 200
[148581.10] GET http://127.0.0.1:4318/assets/geist-latin-wght-normal-BgDaEnEv.woff2 (Font) 200
[148581.11] GET http://127.0.0.1:4318/vite.svg (Other) 200



```

## 4

```bash
python - <<'PY'
from pathlib import Path
import json, os
rows=[]
pidfile=Path('/tmp/webux-live-b-runtime/agent-browser/webux-live-b.pid')
daemon=int(pidfile.read_text().strip())
for p in Path('/proc').iterdir():
    if not p.name.isdigit() or int(p.name)==os.getpid(): continue
    try:
        raw=(p/'cmdline').read_bytes().split(b'\0'); executable=Path(raw[0].decode(errors='replace')).name
        if executable not in {'chrome','chrome_crashpad_handler','node','agent-browser','sh'}: continue
        args=b' '.join(raw).decode(errors='replace')
        if int(p.name)==daemon or '/tmp/webux-live-b-profile' in args or '/tmp/webux-live-b-config' in args or ('vite' in args and '--port 4318' in args): rows.append({'pid':int(p.name),'args':args})
    except OSError: pass
result={'daemon_pid':daemon,'processes':rows}
Path('/tmp/web-ux-20261107-xaye7ceb/candidate/live-results/supplemental-processes-before-cleanup.json').write_text(json.dumps(result,indent=2)+'\n')
print('Owned daemon:',daemon)
print('Owned processes:',[r['pid'] for r in rows])
for row in rows:
    if 'vite' in row['args'] and '--port 4318' in row['args']: print(row)
PY
```

Exit: 0

```text
Owned daemon: 148437
Owned processes: [148320, 148321, 148479, 148481]
{'pid': 148320, 'args': 'sh -c vite preview --host 127.0.0.1 --port 4318 --strictPort '}
{'pid': 148321, 'args': 'node /tmp/web-ux-20261107-xaye7ceb/candidate/live-project/node_modules/.bin/../.pnpm/vite@8.2.2_@types+node@24.13.3_jiti@2.7.0/node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4318 --strictPort '}

```

## 5

```bash
env XDG_RUNTIME_DIR=/tmp/webux-live-b-runtime XDG_CONFIG_HOME=/tmp/webux-live-b-config agent-browser --config /tmp/web-ux-20261107-xaye7ceb/candidate/live-results/browser-config.json --session webux-live-b --profile /tmp/webux-live-b-profile --auto-connect false --headed false --args '--no-sandbox' batch --bail 'press Escape' 'wait --fn '\''document.querySelector('\''\'\'''\''[role="dialog"]'\''\'\'''\'') === null && document.getAnimations().every(a => a.playState !== '\''\'\'''\''running'\''\'\'''\'')'\''' 'snapshot -i' 'eval '\''JSON.stringify({enabled:document.querySelector('\''\'\'''\''#notifications'\''\'\'''\'').getAttribute('\''\'\'''\''aria-checked'\''\'\'''\''),switchBackground:getComputedStyle(document.querySelector('\''\'\'''\''#notifications'\''\'\'''\'')).backgroundColor,fontFamily:getComputedStyle(document.body).fontFamily,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth})'\''' 'screenshot /tmp/web-ux-20261107-xaye7ceb/candidate/live-results/screenshots/10-preview-packaged-font-narrow-form-settled.png --full'
```

Exit: 0

```text
⚠ --profile, --args, --headed ignored: daemon already running. Use 'agent-browser close' first to restart with new options.
✓ Done

true

- generic "PreferencesNotification settingsChoose where and how often you hear from us.Email address (required)" [ref=e1] clickable [onclick]
  - heading "Notification settings" [level=1, ref=e2]
  - textbox "Email address (required)" [required, ref=e5]: narrow@example.test
  - switch "Email notifications" [checked=false, ref=e6]
  - radio "Daily" [checked=false, disabled, ref=e7]
  - radio "Weekly" [checked=true, disabled, ref=e8]
  - button "Discard changes" [ref=e3]
  - button "Review changes" [ref=e4]

"{\"enabled\":\"false\",\"switchBackground\":\"oklch(0.922 0 0)\",\"fontFamily\":\"\\\"Geist Variable\\\", sans-serif\",\"scrollWidth\":320,\"viewport\":320}"

✓ Screenshot saved to /tmp/web-ux-20261107-xaye7ceb/candidate/live-results/screenshots/10-preview-packaged-font-narrow-form-settled.png

```

## 6

```bash
env XDG_RUNTIME_DIR=/tmp/webux-live-b-runtime XDG_CONFIG_HOME=/tmp/webux-live-b-config agent-browser --config /tmp/web-ux-20261107-xaye7ceb/candidate/live-results/browser-config.json --session webux-live-b --profile /tmp/webux-live-b-profile --auto-connect false --headed false --args '--no-sandbox' close
```

Exit: 0

```text
⚠ --profile, --args, --headed ignored: daemon already running. Use 'agent-browser close' first to restart with new options.
✓ Browser closed

```

## 7

```bash
python - <<'PY'
from pathlib import Path
import os, signal, time, json, socket, hashlib
results=Path('/tmp/web-ux-20261107-xaye7ceb/candidate/live-results')
pid=148321
p=Path('/proc')/str(pid)/'cmdline'
args=p.read_bytes().replace(b'\0',b' ').decode() if p.exists() else ''
assert '/tmp/web-ux-20261107-xaye7ceb/candidate/live-project/' in args and 'preview' in args and '--port 4318' in args
os.kill(pid,signal.SIGTERM)
print('SIGTERM sent to owned preview PID',pid)
for _ in range(30):
    if not Path('/proc/148321').exists() and not Path('/proc/148320').exists(): break
    time.sleep(0.1)
matches=[]
for p in Path('/proc').iterdir():
    if not p.name.isdigit() or int(p.name)==os.getpid(): continue
    try:
        args=(p/'cmdline').read_bytes().replace(b'\0',b' ').decode(errors='replace')
        executable=Path(args.split()[0]).name if args.split() else ''
        if executable in {'bash','python','python3','timeout'}: continue
        if '/tmp/webux-live-b-profile' in args or '/tmp/webux-live-b-config' in args or ('vite' in args and '--port 4318' in args): matches.append({'pid':int(p.name),'args':args})
    except OSError: pass
sock=socket.socket(); port=sock.connect_ex(('127.0.0.1',4318));sock.close()
evidence={'owned_profile_or_server_matches':matches,'known_preview_pids_present':[pid for pid in [148320,148321,148437,148479,148481] if Path('/proc',str(pid)).exists()],'browser_pidfile_exists':Path('/tmp/webux-live-b-runtime/agent-browser/webux-live-b.pid').exists(),'port4318_connect_ex':port}
print(json.dumps(evidence,indent=2))
(results/'supplemental-final-cleanup.json').write_text(json.dumps(evidence,indent=2)+'\n')
paths=[results/'final.diff',Path('/tmp/web-ux-20261107-xaye7ceb/candidate/live-project/src/App.tsx'),*sorted((results/'screenshots').glob('*.png'))]
manifest=[{'path':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths]
(results/'artifact-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Verified artifacts:',len(manifest))
assert not matches and not evidence['known_preview_pids_present'] and port != 0 and not evidence['browser_pidfile_exists']
PY
```

Exit: 0

```text
SIGTERM sent to owned preview PID 148321
{
  "owned_profile_or_server_matches": [],
  "known_preview_pids_present": [],
  "browser_pidfile_exists": false,
  "port4318_connect_ex": 111
}
Verified artifacts: 12

```

## 8

```bash
{"tool":"write_stdin","session_id":81443,"chars":""}
```

Exit: 143

```text
[ELIFECYCLE] Command failed with exit code 143.

```

