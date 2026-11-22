const { test, before, after } = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');

const { createApp } = require('../src/app');
const config = require('../src/config');

let server;
let base;
let nextRows = [];
let nextError = null;
const queries = [];

const fakePool = {
  query: async (sql, params) => {
    queries.push({ sql, params });
    if (nextError) throw nextError;
    return { rows: nextRows };
  },
};

const tokenFor = (user) => jwt.sign(user, config.jwtSecret);

before(async () => {
  server = createApp({ pool: fakePool }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test.beforeEach(() => {
  nextRows = [];
  nextError = null;
  queries.length = 0;
});

test('GET /health returns ok', async () => {
  const res = await fetch(`${base}/health`);
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(await res.json(), { status: 'ok' });
});

test('GET /health/db returns 200 when DB is up and 503 when down', async () => {
  assert.strictEqual((await fetch(`${base}/health/db`)).status, 200);
  nextError = new Error('down');
  assert.strictEqual((await fetch(`${base}/health/db`)).status, 503);
});

test('POST /api/auth/login returns a token for valid credentials', async () => {
  nextRows = [{ id: 1, username: 'admin', role: 'admin' }];
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(body.token);
});

test('POST /api/auth/login returns 401 for invalid credentials', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'x', password: 'y' }),
  });
  assert.strictEqual(res.status, 401);
});

test('GET /api/items returns rows', async () => {
  nextRows = [{ id: 1, name: 'Laptop' }];
  const res = await fetch(`${base}/api/items?search=lap`);
  assert.deepStrictEqual(await res.json(), nextRows);
});

test('GET /api/items/:id returns 404 when missing', async () => {
  const res = await fetch(`${base}/api/items/99`);
  assert.strictEqual(res.status, 404);
});

test('GET /api/items/:id returns the item', async () => {
  nextRows = [{ id: 1, name: 'Laptop' }];
  const res = await fetch(`${base}/api/items/1`);
  assert.strictEqual(res.status, 200);
});

test('POST /api/items requires a token', async () => {
  const res = await fetch(`${base}/api/items`, { method: 'POST' });
  assert.strictEqual(res.status, 401);
});

test('POST /api/items creates an item for an authenticated user', async () => {
  nextRows = [{ id: 4, name: 'Mouse', description: '' }];
  const res = await fetch(`${base}/api/items`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${tokenFor({ id: 2, role: 'user' })}` },
    body: JSON.stringify({ name: 'Mouse' }),
  });
  assert.strictEqual(res.status, 201);
  assert.deepStrictEqual(queries[0].params, ['Mouse', '']);
});

test('DELETE /api/items/:id returns 204 for an authenticated user', async () => {
  const res = await fetch(`${base}/api/items/1`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${tokenFor({ id: 2, role: 'user' })}` },
  });
  assert.strictEqual(res.status, 204);
});

test('GET /api/greet renders a greeting', async () => {
  const res = await fetch(`${base}/api/greet?name=Team`);
  assert.match(await res.text(), /Hello Team/);
});

test('GET /api/files serves a known file and 404s on unknown', async () => {
  assert.strictEqual((await fetch(`${base}/api/files?name=welcome.txt`)).status, 200);
  assert.strictEqual((await fetch(`${base}/api/files?name=nope.txt`)).status, 404);
});

test('GET /api/calc evaluates an expression', async () => {
  const res = await fetch(`${base}/api/calc?expr=1%2B2`);
  assert.deepStrictEqual(await res.json(), { result: 3 });
});

test('GET /api/redirect redirects', async () => {
  const res = await fetch(`${base}/api/redirect?url=/health`, { redirect: 'manual' });
  assert.strictEqual(res.status, 302);
});

test('errors are returned as 500 JSON', async () => {
  nextError = new Error('boom');
  const res = await fetch(`${base}/api/items`);
  assert.strictEqual(res.status, 500);
});
