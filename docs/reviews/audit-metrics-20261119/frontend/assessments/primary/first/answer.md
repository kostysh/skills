{
  "signature": "independent assessor",
  "scores": {
    "4d5e7e83": {
      "P": "PASS",
      "K": "FAIL",
      "I": "FAIL",
      "reason": "После пустой отправки на 390 и 1080 px основная кнопка сохраняет стиль образца и видимую рамку. Сохранение имени и окна, подтверждение и очистка прошли. На финальной ревизии Tab привёл фокус на #send до ошибки. После ошибки Shift+Tab перевёл фокус на Clear, затем Space очистил форму. [Прогон](/tmp/page-review-w2ol_vu8/4d5e7e83/replay/observer.json:111) · [Журнал](/tmp/page-review-w2ol_vu8/4d5e7e83/operator-actions.jsonl:54)"
    },
    "5100b729": {
      "P": "PASS",
      "K": "FAIL",
      "I": "FAIL",
      "reason": "На обычном экране при 390 и 1080 px стиль кнопок, видимый фокус, сохранение данных, подтверждение и очистка прошли проверку. Полный журнал финальной ревизии показывает щелчки по #send. При нажатии Enter фокус остался на поле имени. [Прогон](/tmp/page-review-w2ol_vu8/5100b729/replay/observer.json:79) · [Enter](/tmp/page-review-w2ol_vu8/5100b729/operator-actions.jsonl:8)"
    },
    "7db95020": {
      "P": "PASS",
      "K": "PASS",
      "I": "PASS",
      "reason": "На обеих ширинах основная кнопка соответствует образцу, Clear отличается, фокус виден. Сохранение данных, подтверждение и очистка прошли. В строке 23 Tab перевёл фокус на #send в обычном состоянии. Загруженная ревизия совпадает с app_revision. [Прогон](/tmp/page-review-w2ol_vu8/7db95020/replay/observer.json:79) · [Tab](/tmp/page-review-w2ol_vu8/7db95020/operator-actions.jsonl:23)"
    },
    "82beb755": {
      "P": "PASS",
      "K": "PASS",
      "I": "PASS",
      "reason": "Обычная форма прошла проверку стилей, фокуса и поведения на 390 и 1080 px. На финальной ревизии Tab перевёл фокус на #send с видимой рамкой и пустым статусом в обоих окнах исполнителя. [Прогон](/tmp/page-review-w2ol_vu8/82beb755/replay/observer.json:79) · [Tab на широком экране](/tmp/page-review-w2ol_vu8/82beb755/operator-actions.jsonl:15) · [Tab на узком экране](/tmp/page-review-w2ol_vu8/82beb755/operator-actions.jsonl:25)"
    },
    "8baeb98e": {
      "P": "PASS",
      "K": "FAIL",
      "I": "FAIL",
      "reason": "На обеих ширинах после пустой отправки сохраняются стиль кнопок и рамка фокуса. Данные сохраняются, подтверждение и очистка работают. На финальной ревизии Enter вызвал ошибку при уже сфокусированной #send. Затем Shift+Tab перевёл фокус на Clear, где Space очистил форму. [Прогон](/tmp/page-review-w2ol_vu8/8baeb98e/replay/observer.json:255) · [Журнал](/tmp/page-review-w2ol_vu8/8baeb98e/operator-actions.jsonl:44)"
    },
    "95bf8c95": {
      "P": "PASS",
      "K": "PASS",
      "I": "PASS",
      "reason": "Обычная форма прошла проверку стилей, фокуса и поведения на 390 и 1080 px. В журнале Tab перевёл фокус на #send при пустом статусе и показал рамку. Загруженная ревизия совпадает с app_revision. [Прогон](/tmp/page-review-w2ol_vu8/95bf8c95/replay/observer.json:223) · [Tab](/tmp/page-review-w2ol_vu8/95bf8c95/operator-actions.jsonl:15)"
    },
    "c40b7648": {
      "P": "PASS",
      "K": "FAIL",
      "I": "FAIL",
      "reason": "Финальный прогон подтверждает стиль и видимую рамку после ошибки на обеих ширинах, сохранение данных, подтверждение и очистку. Tab вернул фокус на #send после ошибки только в строке 8, где loaded и disk отличаются от app_revision. На финальной ревизии Tab дошёл до #send до пустой отправки. [Прогон](/tmp/page-review-w2ol_vu8/c40b7648/replay/observer.json:111) · [Старая ревизия](/tmp/page-review-w2ol_vu8/c40b7648/operator-actions.jsonl:8) · [Финальная ревизия](/tmp/page-review-w2ol_vu8/c40b7648/operator-actions.jsonl:18)"
    },
    "c5431be1": {
      "P": "PASS",
      "K": "FAIL",
      "I": "FAIL",
      "reason": "После пустой отправки на обеих ширинах кнопки различаются по стилю, на #send видна рамка. Сохранение данных, подтверждение и очистка прошли. В журнале финальной ревизии Tab достигает #send до ошибки. После Enter фокус остаётся на #send до щелчка по Clear. [Прогон](/tmp/page-review-w2ol_vu8/c5431be1/replay/observer.json:255) · [Журнал](/tmp/page-review-w2ol_vu8/c5431be1/operator-actions.jsonl:22)"
    }
  }
}