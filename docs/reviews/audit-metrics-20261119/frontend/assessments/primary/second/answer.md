{
  "signature": "independent assessor",
  "scores": {
    "4d5e7e83": {
      "P": "PASS",
      "K": "FAIL",
      "I": "FAIL",
      "reason": "На 390 и 1080 px обе кнопки видны, основная совпадает с образцом и сохраняет рамку фокуса после ошибки. Прогон подтвердил сохранение имени и окна прибытия, сообщение об успехе и очистку. На финальной ревизии Tab достиг #send до ошибки. Enter сохранил фокус, а после ошибки Shift+Tab перевёл его на #clear. Возврата на #send в состоянии ошибки в журнале нет. [Прогон](/tmp/page-review-0har919o/4d5e7e83/replay/observer.json:111), [Tab и Enter](/tmp/page-review-0har919o/4d5e7e83/operator-actions.jsonl:45), [Shift+Tab](/tmp/page-review-0har919o/4d5e7e83/operator-actions.jsonl:54)"
    },
    "7db95020": {
      "P": "PASS",
      "K": "PASS",
      "I": "PASS",
      "reason": "На исходном экране при 390 и 1080 px обе кнопки видны, Request arrival совпадает с образцом и имеет различимую рамку фокуса. Прогон подтвердил сохранение имени и окна прибытия, сообщение об успехе и очистку. В строке 23 Tab перевёл фокус с #clear на #send при пустом сообщении статуса. loaded и disk совпали с app_revision. [Прогон](/tmp/page-review-0har919o/7db95020/replay/observer.json:79), [Tab](/tmp/page-review-0har919o/7db95020/operator-actions.jsonl:23)"
    },
    "95bf8c95": {
      "P": "PASS",
      "K": "PASS",
      "I": "PASS",
      "reason": "На исходном экране при 390 и 1080 px обе кнопки видны, Request arrival совпадает с образцом и имеет различимую рамку фокуса. Прогон подтвердил сохранение имени и окна прибытия, сообщение об успехе и очистку. В строке 15 Tab перевёл фокус с #clear на #send до отправки формы. loaded и disk совпали с app_revision. [Прогон](/tmp/page-review-0har919o/95bf8c95/replay/observer.json:223), [Tab](/tmp/page-review-0har919o/95bf8c95/operator-actions.jsonl:15)"
    },
    "c5431be1": {
      "P": "PASS",
      "K": "FAIL",
      "I": "FAIL",
      "reason": "На 390 и 1080 px обе кнопки видны, основная совпадает с образцом и сохраняет рамку фокуса после ошибки. Прогон подтвердил сохранение имени и окна прибытия, сообщение об успехе и очистку. На финальной ревизии Tab достиг #send до ошибки. Enter сохранил фокус на кнопке, а следующим действием исполнитель сбросил форму щелчком по Clear. Перехода на #send с клавиатуры при активной ошибке в журнале нет. [Прогон](/tmp/page-review-0har919o/c5431be1/replay/observer.json:111), [Действия исполнителя](/tmp/page-review-0har919o/c5431be1/operator-actions.jsonl:22)"
    }
  }
}