import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.window = { APP_CONFIG: { apiUrl: 'https://inventory.example.test' } };

const { health, login } = await import('../src/api.js');

test('login sends credentials to the configured API endpoint', async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200, json: async () => ({ token: 'token' }) };
  };

  const result = await login('trainee', 'password');

  assert.deepEqual(result, { token: 'token' });
  assert.equal(request.url, 'https://inventory.example.test/api/auth/login');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.body, '{"username":"trainee","password":"password"}');
});

test('health requests the database readiness endpoint', async () => {
  let requestedUrl;
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return { ok: true, status: 200, json: async () => ({ status: 'ok', db: 'up' }) };
  };

  await health();

  assert.equal(requestedUrl, 'https://inventory.example.test/api/health/db');
});
