import './environment.mjs';
import { Hono } from 'hono';
import { observeRequest, requireEmployee } from './desk-middleware.mjs';
import { readDocument } from './public/desk-client.mjs';

export const app = new Hono();
app.use('/documents/*', observeRequest);
app.use('/documents/*', requireEmployee);

app.get('/documents/:id', async (c) => {
  const principal = c.get('employee');
  const id = c.req.param('id');
  const { status, data, error } = await readDocument(principal, id);

  if (status !== 200 || error !== null || !Array.isArray(data) || data.length > 1) {
    throw new Error('Unexpected document read response');
  }
  if (data.length === 0) return c.json({ error: 'not_found' }, 404);

  const [document] = data;
  return c.json({ id: document.id, title: document.title }, 200);
});
