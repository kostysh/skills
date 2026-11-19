import { Hono } from 'hono';
export const app = new Hono();

app.onError('/records/*', (c) => c.json({ error: 'record_pending' }, 503));

// Current project's mapping for the rest of the application.
app.onError((c) => c.json({ error: 'general_unavailable' }, 503));
const records = new Map([['river', 'River notebook']]);
app.get('/records/:id', c => {
  if (c.req.param('id') === 'delayed') throw new Error('stored source pending');
  return c.json({ title: records.get(c.req.param('id')) }, 200);
});
app.get('/general/delayed', () => { throw new Error('private service detail'); });
