import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { config } from 'dotenv';

config();

const app = new Hono();

app.get('/', (c) => c.text('ok'));

app.post('/post', async (c) => {
  const contentType = c.req.header('content-type') ?? '';
  let payload: unknown = null;

  if (contentType.includes('application/json')) {
    payload = await c.req.json();
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await c.req.parseBody();
    payload = form;
  } else if (contentType.includes('text/plain')) {
    payload = await c.req.text();
  } else {
    const raw = await c.req.arrayBuffer();
    payload = Buffer.from(raw).toString('base64');
  }

  return c.json({
    ok: true,
    payload,
  });
});

const port = Number(process.env.PORT ?? 8080);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  },
);
