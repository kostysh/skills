import './environment.mjs';
import { Hono } from 'hono';
import { readDocument } from './public/desk-client.mjs';
import { sessionRequired, verifiedEmployee } from './session.mjs';

export const app = new Hono();

app.get('/documents/:id', async (c) => {
  const principal = verifiedEmployee(c.req.raw);
  if (!principal) return sessionRequired();

  const id = c.req.param('id');
  const { status, data, error } = await readDocument(principal, id);
  if (status !== 200 || error !== null || !Array.isArray(data)) {
    throw new Error('Document read failed');
  }
  if (data.length === 0) return c.json({ error: 'not_found' }, 404);

  const [document] = data;
  if (data.length !== 1 || document?.id !== id || typeof document.title !== 'string') {
    throw new Error('Unexpected document read result');
  }
  return c.json({ id: document.id, title: document.title }, 200);
});
