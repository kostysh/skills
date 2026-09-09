window.__keydiag = [];
for (const type of ['keydown', 'keyup', 'focusin', 'click']) {
  document.addEventListener(type, (event) => {
    window.__keydiag.push({ type: event.type, key: event.key ?? null, target: event.target.id ?? null, eventTime: event.timeStamp, observedAt: performance.now(), trusted: event.isTrusted });
  }, { capture: true, passive: true });
}
