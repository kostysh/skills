"""Generate the stable receipt map without modifying the signed assessments."""
import json
import os
from study import ROOT,REPO
from links import durable

def main():
    keys=json.loads((ROOT/'score-key.json').read_text())
    inverse={code:ident for ident,code in keys.items()}
    values=['# Связь анонимных ссылок с постоянными файлами','','Имена каталогов в подписанных ответах принадлежали временным сессиям. Для каждого кода ниже указаны те же байты и номера строк в материале репозитория. Снимки входят в папку observed рядом с observer.json.','','| Оценщик | Код | Исполнение | Проверка и исходные строки |','| --- | --- | --- | --- |']
    for f in sorted((ROOT/'assessments').glob('*/*/signed.json')):
        data=json.loads(f.read_text())['answers']['scores']
        for code,score in sorted(data.items()):
            ident=inverse[code]; reason,links=durable(score['reason'],code,ident)
            refs=['['+p['label']+', строка '+str(p['line'])+']('+os.path.relpath(REPO/p['file'],ROOT)+'#L'+str(p['line'])+')' for p in links]
            values.append('| ['+f.parent.name+']('+f.relative_to(ROOT).as_posix()+') | '+code+' | ['+ident+'](runs/'+ident+'/events.jsonl) | '+' · '.join(refs)+' |')
    (ROOT/'evidence-index.md').write_text('\n'.join(values)+'\n')
if __name__=='__main__':main()
