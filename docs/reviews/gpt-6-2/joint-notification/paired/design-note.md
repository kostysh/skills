# Notification settings на ширине 390 px

**Cancel** возвращает к редактированию и оставляет введённые значения черновиком. **Close** закрывает окно после подтверждения, пока форма продолжает применять настройки.

Проверено в локальном Chrome через [BROWSER.md](BROWSER.md). В каждом проходе форма начинала с пустого адреса, выбранного **Daily** и включённых **Email notifications**. Введите `weekly@example.com` в **Email address (required)**, выберите **Weekly** («One weekly digest») и откройте **Review changes**. На форме **Weekly** отмечена тёмным кольцом, а **Review changes** — тёмная кнопка на всю ширину полей.

## До подтверждения — Cancel

- **Перед выбором.** Белое окно **Review your changes** размывает форму на фоне. Под заголовком стоит «Confirm to apply these notification settings for this session.» Серые подписи и тёмные значения идут в колонку: **Email address** — `weekly@example.com`, **Email notifications** — **On**, **Delivery frequency** — **Weekly**. Сверху тёмная кнопка **Confirm**, снизу светлая **Cancel** с рамкой. Начальный фокус на **Cancel**, при открытии с клавиатуры видна обводка. **Tab** переводит фокус на **Confirm**.
- **После Cancel.** Окно исчезает, фокус возвращается на **Review changes**, а при работе с клавиатуры видна обводка кнопки. В полях остаются `weekly@example.com`, **Weekly** и включённые уведомления. Это черновик. Через две секунды статус применения или успеха по-прежнему отсутствует. **Escape** на предпросмотре даёт тот же результат. [Предпросмотр](visits/4ebaa104-2d06-435a-8593-81756d593353.png) · [Возврат в форму](visits/241aca91-1669-413c-b7b0-4aad25e1d23c.png)

## После подтверждения — Close

- **Перед выбором.** После **Confirm** окно показывает **Applying changes**, те же три значения и подсказку «You can close this window. Your changes will continue to apply.» Сверху бледная недоступная кнопка **Applying…**, снизу тёмная **Close**. Фокус переходит на **Close**. [Окно применения](visits/655c7197-798a-4bff-8837-ea5926569bf9.png)
- **Сразу после Close.** Окно исчезает. Серая кнопка **Review changes** недоступна, под формой появляется светло-серый статус **Applying changes…** с тёмной полосой слева. Фокус переходит на этот статус. **Escape** во время применения даёт тот же результат. [Применение после закрытия](visits/f32dc88f-a51a-45b4-ae96-9c9bd6fb4e81.png)
- **По завершении.** **Review changes** снова становится тёмной и доступной. Фокус переходит на светлый блок **Settings applied** под формой. В блоке указано «Email: weekly@example.com. Notifications: On. Frequency: Weekly.» В форме остаются эти же значения, теперь они применены для текущей сессии. Подпись в блоке — «Saved for this session. No email is sent.» [Итог с клавиатурным фокусом](visits/ecafaf41-c009-4b20-896a-31bba6d8b26f.png) · [Журнал прохода с Close](visits/a991edfe-6f1b-4f24-83df-a127abf8c99a.json)
