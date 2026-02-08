import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { config } from 'dotenv';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { User } from './db/User';

config();

const app = new Hono();
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

function getFirebaseAuth() {
  if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
    throw new Error('Firebase admin credentials are not set');
  }
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: firebaseProjectId,
        clientEmail: firebaseClientEmail,
        privateKey: firebasePrivateKey,
      }),
    });
  }
  return getAuth();
}

app.get('/', (c) => c.text('ok'));

app.post('/ping', async (c) => {
  let auth;
  try {
    auth = getFirebaseAuth();
  } catch {
    return c.json({ message: 'Firebase admin credentials are not set' }, 500);
  }

  const authHeader = c.req.header('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  let decoded;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  if (!decoded.email) {
    return c.json({ message: 'Email is required' }, 400);
  }

  const name = decoded.name ?? decoded.email;
  const existing = await User.find({ firebaseId: decoded.uid });
  if (!existing) {
    await User.create({
      name,
      email: decoded.email,
      firebaseId: decoded.uid,
    });
  } else if (existing.email !== decoded.email || existing.name !== name) {
    await existing.update({ email: decoded.email, name });
  }

  return c.json({ message: 'pong!' });
});

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
