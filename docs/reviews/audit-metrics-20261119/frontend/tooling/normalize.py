"""Join fixed assignments to archived actions and independent signed scores."""
import argparse
import json
from pathlib import Path
from study import ROOT,MODEL,SECONDARY,REPO,json_write,sha
from links import durable

def read(p):return json.loads(p.read_text())
def loc(p):return str(p.relative_to(REPO))
def main():
    p=argparse.ArgumentParser();p.add_argument('--conditional',action='store_true');args=p.parse_args()
    reg=read(ROOT/'registration.json');keys=read(ROOT/'score-key.json')
    assessments={}
    for p in (ROOT/'assessments').glob('*/*/signed.json'):
        stage=p.parents[1].name;role=p.parent.name
        for k,v in read(p)['answers']['scores'].items():
            assessments.setdefault(k,{})[role]=(v,p)
    included=[k for k,v in reg['assignments'].items() if args.conditional or v['phase']=='primary']
    pairs=[pair for pair in reg['pairs'] if args.conditional or not pair.get('conditional')]
    for model in [MODEL,SECONDARY]:
        assigned=[i for i in included if reg['assignments'][i]['model']==model]
        if not assigned:continue
        doc={'skill':'frontend-design','study':'живые формы 2026-11-19','model':model,'effort':'medium','taskSet':'frontend-pilot','source':loc(ROOT/'protocol.md'),'runs':{},'series':[],'agreement':[],'technicalStarts':[]}
        groups={}; limits={}
        for i in assigned:
            a=reg['assignments'][i];src=ROOT/'runs'/i;signature=src/'result.json'
            if not signature.is_file() or not read(signature)['complete']:
                event=src/'events.jsonl'
                if event.exists():doc['technicalStarts'].append({'id':'start-'+i,'source':loc(event),'reason':'Нет полного ответа на техническом старте.'})
                continue
            exposure=read(src/'exposure.json')
            if exposure['delegationEvents']:limits[i]='Неподтверждённые границы делегирования.'
            if read(signature)['unexpectedInputEdits']:limits[i]='Исполнитель изменил часть инструментария или выдачи инструкций.'
            if a['variant']!='none' and (not exposure['rootReadLines'] or not exposure['strategyReadLines']):
                limits[i]='Нет подтверждения чтения полного активного набора инструкций (корень и применимый справочник).'
            if a['variant']=='none' and (exposure['rootReadLines'] or exposure['strategyReadLines']):
                limits[i]='В контроле обнаружено чтение скила.'
            variant='package' if a['variant']=='full' else a['variant']
            axis='P' if variant in ('package','none') else 'I'
            rubric='form-v1-'+axis
            r={'task':a['task'],'variant':variant,'source':loc(src/'events.jsonl'),'sha256':sha((src/'events.jsonl').read_bytes()),'ratings':{}}
            opinions=assessments.get(keys[i],{})
            for role,(op,signed) in opinions.items():
                primary=next((json.loads(line)['thread_id'] for line in (signed.parent/'events.jsonl').read_text().splitlines() if json.loads(line)['type']=='thread.started'),None)
                assert primary
                reason,proof=durable(op['reason'],keys[i],i)
                r['ratings'][role]={'assessor':primary,'rubric':rubric,'packet':'form-observations-v1','score':op[axis],'source':loc(signed),'reason':reason,'evidence':proof}
            if a['variant']=='B':
                chosen=opinions.get('first')
                if 'first' in opinions and 'second' in opinions and opinions['first'][0]['K']!=opinions['second'][0]['K']:chosen=opinions.get('third')
                k='INCONCLUSIVE' if not chosen else chosen[0]['K']
                note,proof=durable(chosen[0]['reason'],keys[i],i) if chosen else ('Нет согласованной оценки действия по данному запуску.',[])
                lines=[x['line'] for x in proof if x['file'].endswith('/browser.jsonl')]
                if lines:note+=' Журнал действий, строки '+', '.join(map(str,lines))+'.'
                source=loc(src/'browser.jsonl')+('#L'+str(lines[-1]) if lines else '')
                r['behavior']={'result':{'PASS':'done','FAIL':'missed','INCONCLUSIVE':'unknown'}[k],'source':source,'note':note}
            doc['runs'][i]=r
        for pair in pairs:
            if pair['model']!=model:continue
            typ=pair['type'];phase=pair['phase'];name=typ+'-'+phase
            axis='P' if typ=='package/none' else 'I'
            group=groups.setdefault(name,{'id':name,'comparison':typ,'phase':phase,'rubric':'form-v1-'+axis,'packet':'form-observations-v1','pairs':[],'source':loc(ROOT/'registration.json'),'limit':('Один отложенный случай в отдельном проекте Hawthorn Works.' if phase=='holdout' else 'Два варианта формы North Quay; вывод ограничен этими заданиями.')})
            if 'B' in typ.split('/'):group['bRemoval']='complete'
            p={'id':pair['id'],'task':pair['task']}
            reasons=[]
            for side in ['left','right']:
                i=pair[side]
                if i not in doc['runs']:p[side]=None;reasons.append('Назначенное исполнение отсутствует.')
                else:
                    p[side]=[i,'first'] if 'first' in doc['runs'][i]['ratings'] else [i,None]
                    if i in limits:reasons.append(limits[i])
            if reasons:p['reason']=' '.join(dict.fromkeys(reasons))
            group['pairs'].append(p)
        doc['series']=list(groups.values())
        for i in reg['doubleGrade']:
            if i not in assigned:continue
            r=doc['runs'].get(i,{});variant=reg['assignments'][i]['variant'];axis='P' if variant in ('none','full') else 'I'
            sample={'run':i,'ratings':[role if role in r.get('ratings',{}) else None for role in ['first','second']],'rubric':'form-v1-'+axis,'packet':'form-observations-v1'}
            if 'third' in r.get('ratings',{}):sample['resolution']='third'
            doc['agreement'].append(sample)
        formal=ROOT/'formal-events.json'
        if model==MODEL and formal.exists():doc['attempts']=read(formal)
        json_write(ROOT/('metrics-'+model+'.json'),doc)
    print('Normalized',len(included),'assigned executions.',flush=True)
if __name__=='__main__':main()
