"""Normalize signed evidence into the repository study format and its per-version reading pages."""
from decision import *

CASES={
    'code-reviewer': [('Q-27','Обе стороны разрешили слияние. Числовая сортировка сохраняет порядок равных номеров.'),
        ('P-84','Обе стороны нашли подмену нулевого остатка знаком «—» и оставили проверку макета открытой. Обе сделали печать на физическом терминале обязательным условием слияния без основания в заявке.')],
    'concept-conformance-reviewer': [('T-14','Обе стороны приняли критерии будущей проверки восстановления потока табло и оставили подтверждение реализации до прогона.'),
        ('D-8','Обе стороны подтвердили сохранение записи отправителя. Подставленная очередь на приёмной станции не доказывала получение назначения следующей сменой. Пункт оставили открытым.')],
    'gdpr-compliance': [('C14','Обе стороны разрешили ограниченный переход для зала S, опираясь на решение владельца, проверку прав и прекращение выдачи талона через 24 часа.'),
        ('M7','Обе стороны удержали запуск факультативной аналитики до отдельного решения директора. Стендовая проверка подтвердила только поведение стенда.')],
    'retrospective-analysis': [('O-41','Обе стороны отделили ручное исправление заказа G41R от действия нового контроля. Он остановил G47 до отправки и пропустил полный G50.'),
        ('B-29','Обе стороны различили ручную перепечатку, проверенного кандидата и сбой рабочей линии. Только ответ с пакетом поручил установить или активировать проверенный профиль на линии перед повторной проверкой.')],
    'security-reviewer': [('N-24','Обе стороны установили, что публиковать недельное объявление в данном снимке может только диспетчер D19.'),
        ('M-38','Обе стороны нашли лишнее право координатора H03 на полный текст бюллетеня через подборку. Снимок подтверждает доступ, факт чтения неизвестен.')],
    'spec-conformance-reviewer': [('K-17','Обе стороны правильно приняли три выхода публичной команды. Ответ с пакетом дополнительно заявил о сверке трёх файлов до и после запуска. Журнал подтвердил такую сверку только после запуска.'),
        ('N-42','Обе стороны отказали в приёмке из-за значения «0» вместо пустой строки по PN-2. Словарь одного процесса не подтвердил чтение из штатного архива после перезапуска по PN-3.')],
    'web-ui-reviewer': [('U-17','В записи Chromium обе стороны подтвердили закрытие диалога по Escape, сохранение позывного «Ветер» и возврат фокуса на кнопку второго ряда.'),
        ('P-08','Обе стороны нашли отсутствующую карточку прибора в резерве и учли согласованное исключение для журнала измерений.')]}
RET='retrospective-analysis'
TITLES={'ordinary':'Обычный','boundary':'Граничный'}
check_dir='assessments/behavior-check'
def read(p):return json.loads(p.read_text())
def verdict_counts(pairs):
    return [pairs.count(t) for t in [('PASS','FAIL'),('FAIL','PASS'),('PASS','PASS'),('FAIL','FAIL')]]+[sum('INCONCLUSIVE' in t for t in pairs)]

def extra_codes(skill):
    if skill!=RET:return {}
    f=ROOT/skill/check_dir
    key={x['freshLabel']:x['baseLabel'] for x in read(f/'reveal.json')['assignments']}
    extra={}
    for part in ('','adjudication/'):
        filename=part+'signed.json'
        for r in read(f/filename)['ratings']:
            extra[key[r['label']]]={'result':r['behavior'],'note':r['reason'],'source':check_dir+'/'+filename}
    return extra

def produce(skill,cutoff):
    folder=ROOT/skill; pub=PACKAGE[skill]
    version=pub['version']; final_receipt='audit-delta' if skill==RET else 'audit'
    audit=read(folder/final_receipt/'signed.json')
    audit_event=read(folder/final_receipt/'result.json')
    release=read(ROOT/'packages/release-dates.json')['skills'][skill]['earliestMatchingPublicStable']
    rows=scores(skill)
    supplement=extra_codes(skill)
    outcome=audit['verdict']
    signed_path='results.md#decision'
    doc={'skill':skill,'study':'Индивидуальные испытания 2026-11-22','base':folder.relative_to(REPO).as_posix(),
         'model':MODEL,'effort':'medium','source':'results.md','taskSet':skill+'-individual-20261122',
         'registration':'../registration.json','archiveSha256':pub['sha256'],'runs':{},'series':[],'agreement':[],'attempts':[]}
    for ident,row in rows.items():
        ratings={}
        for role,score in row['ratings'].items():
            receipt=folder/'assessments'/role
            grade=read(receipt/'signed.json')
            ratings[role]={'assessor':grade['assessor'],'thread':read(receipt/'result.json')['thread'],'rubric':'R1',
               'packet':'P1','packetSha256':sha((folder/'assessments/packets'/(row['label']+'.json')).read_bytes()),
               'score':score['score'],'source':'assessments/'+role+'/signed.json','label':row['label'],
               'reason':score['reason'],'behavior':score['behavior'],'behaviorReason':score['behaviorReason']}
        selected='adjudicator' if 'adjudicator' in ratings else 'first'
        primary={'result':row['behavior'],'note':row['behaviorReason'],'source':ratings[selected]['source']}
        run={'task':row['case'],'variant':row['variant'],'sha256':row['rawEventsSha256'],
             'source':'runs/'+ident+'/events.jsonl.gz','answer':'runs/'+ident+'/answer.md','delivery':'runs/'+ident+'/delivery.json',
             'ratings':ratings,'behavior':supplement.get(row['label'],primary)}
        if supplement:run['primaryBehavior']=primary
        doc['runs'][ident]=run
    series={'id':'Версия / без пакета','comparison':version+'/B','phase':'primary','rubric':'R1','packet':'P1',
            'bRemoval':'complete','source':'results.md#pairs','limit':'Две локальные задачи, явная загрузка, '+MODEL+' / medium.','pairs':[]}
    doc['series'].append(series); pair_scores=[]
    for case in TITLES:
        a=next(i for i,r in rows.items() if r['case']==case and r['variant']==version)
        b=next(i for i,r in rows.items() if r['case']==case and r['variant']=='B')
        series['pairs'].append({'id':case+'-1','task':case,'left':[a,'first'],'right':[b,'first']})
        pair_scores.append((rows[a]['score'],rows[b]['score']))
    double=REG['doubleRating'][skill]
    g={'run':double,'rubric':'R1','packet':'P1','ratings':['first','second']}
    if 'adjudicator' in doc['runs'][double]['ratings']:
        g.update({'resolution':'adjudicator','reason':'Первичные оценки расходились только по наблюдаемому действию K.'})
    doc['agreement'].append(g)
    receipts=['audit','audit-delta'] if skill==RET else ['audit']
    for order, receipt in enumerate(receipts,1):
        evt=read(folder/receipt/'result.json')
        attempt={'id':'individual-1' if order==1 else 'K-delta-2','order':order,
                 'snapshot':version+' archive-sha256 '+pub['sha256'],'scope':'individual',
                 'source':signed_path if receipt==final_receipt else receipt+'/signed.json',
                 'verdict':read(folder/receipt/'signed.json')['verdict'],'timelineSource':receipt+'/result.json',
                 **{k:evt[k] for k in ('handed','started','decided')}}
        doc['attempts'].append(attempt)
    if outcome=='FAIL':
        defect={'code-reviewer':'P-84. У обязательной проверки на оборудовании отсутствует основание в заявке.',
                'spec-conformance-reviewer':'K-17. Журнал не подтверждает заявленную предварительную сверку контрольных сумм.'}[skill]
        attempt['returned']={'primary':'evidence','finding':defect,'source':signed_path,'limit':'Основание или действие исполнителя. Причинный дефект инструкции не установлен.'}
    if outcome=='PASS':
        doc['observation']={'version':version,'accepted':audit_event['decided'],'released':release,'through':cutoff,
            'systematic':False,'defects':[],'source':'../README.md#limits'}
    if supplement:doc['behaviorSupplement']={'scope':'Только K на четырёх исходных работах','registration':check_dir+'/registration.json',
        'signed':check_dir+'/signed.json','arbitration':check_dir+'/adjudication/signed.json'}
    write(folder/'metrics.json',doc)
    joint=os.path.relpath(REPO/INDEX[skill]['source'],folder)
    note=[f'# {skill} {version}', '', '<a id="decision"></a>', '',f"**{outcome}.** "+audit['rationale'],'',
         'Независимый аудитор оценивал исполнение на двух зарегистрированных задачах. '
         f'[Подписанное решение с основаниями и пределами]({final_receipt}/signed.json) · [События решения]({final_receipt}/result.json) · [Прежняя совместная приёмка]({joint})',
         '', '<a id="pairs"></a>', '', '## Назначенные пары', '',
         '| Задание | Полный пакет | Без пакета | Наблюдение |','| --- | --- | --- | --- |']
    for ix,(case,pair) in enumerate(zip(TITLES,series['pairs'])):
        a,b=pair['left'][0],pair['right'][0]; name,meaning=CASES[skill][ix]
        note.append(f"| [{name}](inputs/{case}/task.md) · [файлы](inputs/{case}/project/) | [{rows[a]['score']}](runs/{a}/answer.md) | [{rows[b]['score']}](runs/{b}/answer.md) | {meaning} |")
    counts=verdict_counts(pair_scores)
    note+=['',f'Назначено 2 пары. Лучше — {counts[0]}, хуже — {counts[1]}, обе прошли — {counts[2]}, обе ошиблись — {counts[3]}, недостаточно данных — {counts[4]}.',
           '', '## Свидетельства', '', '| Случай и вариант | Запись исполнителя | Слепая оценка | Наблюдаемое действие K |',
           '| --- | --- | --- | --- |']
    for i,r in rows.items():
        side='без пакета' if r['variant']=='B' else 'с пакетом'
        k=doc['runs'][i]['behavior']
        note.append(f"| {TITLES[r['case']]}, {side} | [выдача](runs/{i}/delivery.json) · [действия](runs/{i}/events.jsonl.gz) · [состояние](runs/{i}/result.json) | [{r['label']}](assessments/packets/{r['label']}.json) · [{r['score']}](assessments/first/signed.json) | [{k['result']}]({k['source']}) |")
    second=doc['runs'][double]['ratings']['second']; first=doc['runs'][double]['ratings']['first']
    note+=['',f"Для {rows[double]['label']} первичный и второй оценщики подписали {first['score']} и {second['score']}. "
             f"Их исходные отметки K — {first['behavior']} и {second['behavior']}. [Первая оценка](assessments/first/signed.json) · [Вторая оценка](assessments/second/signed.json)"]
    if supplement:
        note+=['','[Первое индивидуальное решение](audit/signed.json) принято до уточнения K. [Аудитор дополнения](audit-delta/signed.json) проверил изменившиеся свидетельства и итог для версии.']
        note+=['','Для обычного случая R1 требует различить исправление заказа и предотвращение повторного возврата по журналу. Первый оценщик использовал запуск Python как условие для K. Арбитр исходной подвыборки подтвердил действие контроля. После первичного решения другой оценщик проверил K у всех четырёх ответов под новыми метками. Две разошедшиеся отметки отдельно рассмотрел слепой арбитр. В таблице приведены итоговые K. В metrics.json сохранены исходные primaryBehavior и все подписи. Дополнительная проверка не меняет ни одной оценки PASS/FAIL и не добавляет исполнений. [Первичный арбитраж](assessments/adjudicator/signed.json) · [Назначение проверки K](assessments/behavior-check/registration.json) · [Четыре наблюдения](assessments/behavior-check/signed.json) · [Арбитраж двух отметок](assessments/behavior-check/adjudication/signed.json)']
    kcounts=[sum(doc['runs'][i]['behavior']['result']==v for i,r in rows.items() if r['variant']=='B') for v in ('done','missed','unknown')]
    note+=['',f'В контроле действие K выполнено на {kcounts[0]} из 2 задач, пропущено на {kcounts[1]}, данных недостаточно для {kcounts[2]}.',
        '',f"Архив содержит {len(pub['files'])} файлов. SHA-256 `{pub['sha256']}`. Модель исполнителей {MODEL}, настройка medium. Индивидуальный вывод ограничен этими заданиями после явной загрузки версии.",
        '', '[Предрегистрация](../registration.json) · [Критерии R1](rubric.md) · [Архив и состав](../packages/manifest.json) · [Машинная запись](metrics.json) · [Сводка серии](../README.md)']
    (folder/'results.md').write_text('\n'.join(note)+'\n')

if __name__=='__main__':
    cutoff=max(read(p)['decided'] for p in ROOT.glob('*/audit*/result.json'))
    for skill in PACKAGE:produce(skill,cutoff)
