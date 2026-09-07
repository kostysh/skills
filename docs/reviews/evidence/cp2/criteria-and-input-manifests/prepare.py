from pathlib import Path
import json, subprocess, hashlib, datetime
base=Path('/tmp/cp2-compiler-20260907-_o2kb18r')
cases=base/'cases'
cli=base/'baseline/scripts/skill-source-compiler.mjs'
logs=[]
def write(path,text):
    path.parent.mkdir(parents=True,exist_ok=True); path.write_text(text)
def command(*args):
    p=subprocess.run(['node',str(cli),*map(str,args)],text=True,capture_output=True)
    logs.append({'args':[str(a) for a in args],'code':p.returncode,'stdout':p.stdout,'stderr':p.stderr})
    if p.returncode: raise RuntimeError(p.stdout+p.stderr)
def bundle(name):
    return {'apiVersion':'skillforge/v1alpha1','kind':'SkillSource','skill':{'name':name,'source-version':'0.1.0','recommended-skill-md-max-bytes':20000,'description':'Turn supplied meeting notes into a concise summary and action list. Use for summarizing an existing meeting record; not for inventing decisions or participants.'},'fragments':{},'references':[],'assets':[],'copies':[],'supporting':[],'surfaces':{'active':{'requiredReferences':[],'optionalReferences':[]},'supportingGlobs':['docs/*']},'sections':{'startHere':['Use the supplied meeting record as the factual source. Return a concise summary and, when present, an action list.','Do not contact participants or update external systems. If the meeting record is absent, request it before summarizing.'],'whenToUse':['Summarize a supplied meeting record into a summary and action list.'],'whenNotToUse':['No meeting record is available or the task requires inventing meeting decisions.'],'workflow':[{'id':'summarize','title':'Summarize the record','goal':'The requester receives a faithful summary and explicit actions supported by the record.','steps':['Extract the stated decisions and actions without inventing facts.'],'validation':['Check each decision and action against the supplied record; mark unknown facts rather than guessing.']}],'interop':[],'commands':[],'gotchas':[],'policies':[{'id':'facts','title':'Factual boundary','text':'Omit unsupported decisions. This summary does not confirm participant agreement or execute the listed actions.'}],'portability':{'required':True,'rules':['Use only the supplied record and guidance inside this folder.'],'checklist':['Confirm every required local reference travels with the folder.']}}}
def save_bundle(folder,data):
    write(folder/'skill.yaml',json.dumps(data,indent=2)+'\n')
    write(folder/'AGENTS.md','# Target maintenance\n\nThis is a documentation-only generated skill. `skill.yaml` is the source of truth. `SKILL.md` and `docs/compile-report.md` are compiler-owned generated output. Maintain the source and regenerate derivatives. There is no application runtime or runtime package. Policy decisions belong to the operator; no source field takes precedence solely by position.\n')
def prompt(case,text):
    write(cases/case/'prompt.md',text+'\n\nРаботай только внутри своего run-каталога: здесь `compiler/` содержит полный предоставленный скил `skill-source-compiler`, а `fixture/` — рабочие материалы. Прочитай `compiler/SKILL.md` и примени его в пределах применимости. Можно читать и менять только файлы своего run-каталога; настоящий локальный Node доступен для shipped CLI. Другие скилы и агенты в этом запуске недоступны. Не публикуй результат и не используй Git. Сохрани краткий `result.md` с фактическим итогом, изменёнными путями, проверками и существенными ограничениями. Не заявляй независимое одобрение от собственного имени.\n')
# 1
c='01'; f=cases/c/'fixture/meeting-note-helper'
write(f/'SKILL.md','''---
name: meeting-note-helper
description: Summarize supplied meeting notes and list explicitly recorded actions.
---

# Meeting note helper

## When to use
Use for turning a supplied meeting record into a concise summmary and action list.

## When NOT to use
Do not use to invent decisions or reconstruct a missing meeting record.

## Guidance
Use only facts in the supplied record. Mark an absent action owner as unassigned. Return the summary followed by actions, if any. Check each entry against the record. Do not contact participants or update external systems. If no record is supplied, ask for it. This skill does not verify agreement or execute actions.
''')
prompt(c,'В `fixture/meeting-note-helper/SKILL.md` исправь опечатку `summmary` на `summary`. Это маленькая правка текста; сохрани остальные формулировки и поведение. Покажи, что исправление сделано.')
# 2
c='02'; f=cases/c/'fixture/meeting-note-helper'; d=bundle('meeting-note-helper')
d['sections']['policies'] += [{'id':'owner-a','title':'Action owner handling','text':'When an action item has no named owner, label its owner as unassigned.'},{'id':'owner-b','title':'Action owner handling','text':'When an action item has no named owner, assign its owner to the meeting note author.'}]
save_bundle(f,d); command('lint',f)
prompt(c,'Подготовь переносимый пакет скила из `fixture/meeting-note-helper` для коллеги и помести его в новый каталог `deliverable/`. Используй текущие исходники, проверь результат и сообщи, можно ли передавать пакет. Если для завершения требуется решение владельца, сформулируй конкретный вопрос в итоговом отчёте.')
# 3
c='03'; f=cases/c/'fixture/meeting-note-helper'; d=bundle('meeting-note-helper')
d['references']=[{'id':'actions','source':'references/action-items.md','target':'references/action-items.md','title':'Action item formatting','trigger':'Read this when the supplied meeting record contains action items; it is not required for records with no actions.','required':True}]
d['surfaces']['active']['requiredReferences']=['actions']
d['sections']['startHere'] += ['When the supplied meeting record contains action items, read references/action-items.md before writing the action list. For records without actions, return the summary only.']
d['supporting']=[{'id':'history','source':'docs/migration-note.md','target':'docs/migration-note.md'}]
write(f/'references/action-items.md','# Action item formatting\n\nFor each explicit action, return task, owner and due date. If the record omits an owner or due date, label that field unassigned or unspecified respectively. Keep an action only when the record supports it. This guidance applies to action-item output only.\n')
write(f/'docs/migration-note.md','# Migration note — historical evidence only\n\nThe retired prototype was once tested in /home/editor/old-meeting-notes. This historical path is not an input, prerequisite or maintained location. The current skill takes a supplied meeting record.\n')
save_bundle(f,d); command('regenerate',f); command('check',f)
prompt(c,'Собери из `fixture/meeting-note-helper` переносимую копию для коллеги в новом каталоге `deliverable/`. Сохрани текущее поведение скила и приложенные материалы. Проверь исходники и итоговый пакет и кратко опиши результат.')
# 4
c='04'; f=cases/c/'fixture/meeting-note-helper'; d=bundle('meeting-note-helper')
d['sections']['policies'].append({'id':'owner','title':'Action owner handling','text':'When an action item has no named owner, assign its owner to the meeting note author.'})
save_bundle(f,d); command('regenerate',f)
d['skill']['source-version']='0.1.1'
d['sections']['policies'][-1]['text']='When an action item has no named owner, label its owner as unassigned. Do not infer ownership from who wrote the notes.'
write(f/'skill.yaml',json.dumps(d,indent=2)+'\n'); command('lint',f)
prompt(c,'Подготовь актуальную переносимую копию `fixture/meeting-note-helper` для передачи коллеге в новом каталоге `deliverable/`. Обнови также generated-файлы в исходной папке. Используй текущие материалы, проверь обе папки и сообщи, что именно теперь готово.')
write(base/'private-criteria/preparation-evidence.json',json.dumps(logs,indent=2)+'\n')
manifest={str(p.relative_to(cases)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(cases.rglob('*')) if p.is_file()}
write(base/'private-criteria/fixture-sha256.json',json.dumps(manifest,indent=2)+'\n')
write(base/'private-criteria/frozen.txt','Frozen UTC: '+datetime.datetime.now(datetime.timezone.utc).isoformat()+'\nCandidate exposure: none. Behavioral runs: none. Fixtures prepared using baseline shipped CLI only.\n')
print('Prepared',len(manifest),'executor-visible files.')
