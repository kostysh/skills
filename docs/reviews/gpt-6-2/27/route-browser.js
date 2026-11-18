async (page) => {
  if (new URL(page.url()).pathname !== '/dossiers/reed') throw new Error('Open the Reed route');
  const source = await page.request.get(page.url());
  const html = await source.text();
  const original = await page.evaluate(text => {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return {
      heading: doc.querySelector('h1')?.textContent,
      ready: doc.querySelector('[data-ready]')?.getAttribute('data-ready'),
      count: doc.querySelector('[role=status]')?.textContent,
      controls: Array.from(doc.querySelectorAll('button'), button => button.textContent)
    };
  }, html);

  function same(actual, expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(JSON.stringify({actual, expected}));
    }
  }
  same(source.status(), 200);
  same(original, {heading: 'Reed docket', ready: 'no', count: 'Selections: 0',
    controls: ['Mark inspected', 'Entry help', 'Owner help']});

  const browser = await page.context().newCDPSession(page);
  const browserVersion = (await browser.send('Browser.getVersion')).product;
  const button = name => page.getByRole('button', {name, exact: true});
  const count = async () => page.getByRole('status').innerText();
  async function describe() {
    const {nodes} = await browser.send('Accessibility.getFullAXTree');
    const buttons = nodes.filter(node => node.role?.value === 'button'
      && ['Entry help', 'Owner help'].includes(node.name?.value));
    return buttons.map(node => [node.name.value, node.description?.value ?? '']);
  }
  async function showBoth() {
    await page.keyboard.press('Tab');
    await button('Owner help').hover();
    const ids = await page.locator('button[aria-describedby]').evaluateAll(
      buttons => buttons.map(node => node.getAttribute('aria-describedby'))
    );
    const descriptions = await describe();
    same(descriptions, [['Entry help', 'Use the approved desk entry'],
      ['Owner help', 'See the owner of this docket']]);
    same(new Set(ids).size, 2);
    await page.keyboard.press('Escape');
    const afterEscape = await describe();
    same(afterEscape.find(([name]) => name === 'Entry help'), ['Entry help', '']);
    return {ids, descriptions, afterEscape};
  }

  await page.reload();
  await page.locator('[data-ready=yes]').waitFor();
  const counts = [await count()];
  const mark = button('Mark inspected');
  await mark.click();
  counts.push(await count());
  await mark.click();
  counts.push(await count());
  const mounted = await showBoth();
  await page.reload();
  await page.locator('[data-ready=yes]').waitFor();
  counts.push(await count());
  await mark.click();
  counts.push(await count());
  const remounted = await showBoth();
  same(counts, ['Selections: 0', 'Selections: 1', 'Selections: 2', 'Selections: 0', 'Selections: 1']);
  return {browserVersion, route: new URL(page.url()).pathname, http: source.status(),
    original, clientReady: 'yes', counts, mounted, afterReload: remounted};
}
