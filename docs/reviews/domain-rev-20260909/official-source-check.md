# Проверка внешних предметных источников

Проверено 09.09.2026 в пределах изменяемых утверждений.

- [EDPB Guidelines 05/2020, version 1.1](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf), adopted 4 May 2020, formatting 13 May 2020: п. 2 и 9 подтверждают consent как одно из оснований, а не универсальный gate; п. 7 сохраняет отдельную применимость ePrivacy. Примеры исправлены условно, конкретная применимость в G03/G07 задаётся синтетическим контрактом, не выводится из этих тестов.
- [EDPB DPO guide](https://www.edpb.europa.eu/sme/be-compliant/data-protection-officer_en) и [Commission DPO responsibilities](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations/data-protection-officers/what-are-responsibilities-data-protection-officer-dpo_en): DPO консультирует и контролирует; ответственность организации не подменяется его рекомендацией. Изменение не создаёт юридического approval.
- EUR-Lex HTML полного GDPR при двух обращениях вернул JavaScript/robot challenge; полный актуальный текст регламента этим обращением не подтверждён. Для указанной узкой дельты доступны официальные EDPB/Commission источники; не заявляется полный актуальный legal audit.
- [PostgreSQL 18 numeric types](https://www.postgresql.org/docs/18/datatype-numeric.html): documented bigint bounds, exact numeric multiplication and rounding properties согласуются с используемой средой. Реальный fixture работает на доступной 18.4, а не заявленной latest patch. Его arithmetic oracle фиксирован независимо до исполнения; SQL division issue обнаружен runtime и сохранён отдельно.
- Financial currency/scale/rate/rounding/retention — явно синтетические решения задач. Новых налоговых ставок, FX, бухгалтерских правил или сроков хранения по закону не выбирали.

- [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model): GPT-6 Astra prompting guidance прочитано при подготовке и принятии задания; применено как guidance по ясным полномочиям, соразмерному запросу и проверяемому результату. Оно не заменяет repository standard и не расширяет scope или разрешения.
