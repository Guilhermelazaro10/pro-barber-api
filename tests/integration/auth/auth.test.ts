import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';
import { buildAuthHeaders, loginAndGetToken } from '../../helpers/auth.js';
import {
  apiRequest,
  isObjectRecord,
  startTestServer,
  stopTestServer,
} from '../../helpers/app.js';
import {
  cleanupTrackedData,
  getSeedBarbershopContext,
  trackEntityId,
} from '../../helpers/db.js';

let baseUrl = '';
let server: Server;

before(async () => {
  const startedServer = await startTestServer();
  baseUrl = startedServer.baseUrl;
  server = startedServer.server;
});

after(async () => {
  await cleanupTrackedData();
  await stopTestServer(server);
});

test('register, login and profile endpoints keep the frontend contract', async () => {
  const seedContext = await getSeedBarbershopContext();
  const uniqueEmail = `cliente-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2, 8)}@teste.com`;

  const { response: registerResponse, body: registerBody } = await apiRequest(
    baseUrl,
    '/api/auth/cadastro',
    {
      method: 'POST',
      body: JSON.stringify({
        nome: 'Cliente Teste',
        email: uniqueEmail,
        senha: '123456',
        telefone: '85988887777',
        barbeariaId: seedContext.barbeariaId,
      }),
    }
  );

  assert.equal(registerResponse.status, 201);
  assert.ok(registerResponse.headers.get('x-request-id'));
  assert.equal(isObjectRecord(registerBody), true);

  if (!isObjectRecord(registerBody) || !isObjectRecord(registerBody.data)) {
    throw new Error('Resposta de cadastro fora do contrato esperado.');
  }

  assert.equal(registerBody.data.email, uniqueEmail);
  assert.equal(registerBody.data.role, 'CLIENTE');

  if (typeof registerBody.data.id !== 'string') {
    throw new Error('ID do usuario cadastrado nao retornado.');
  }

  trackEntityId('users', registerBody.data.id);

  const token = await loginAndGetToken(baseUrl, uniqueEmail, '123456');
  const { response: meResponse, body: meBody } = await apiRequest(
    baseUrl,
    '/api/auth/me',
    {
      headers: buildAuthHeaders(token),
    }
  );

  assert.equal(meResponse.status, 200);
  assert.equal(isObjectRecord(meBody), true);

  if (!isObjectRecord(meBody) || !isObjectRecord(meBody.data)) {
    throw new Error('Resposta de perfil fora do contrato esperado.');
  }

  assert.equal(meBody.data.email, uniqueEmail);
  assert.equal(meBody.data.barbeariaId, seedContext.barbeariaId);
});

test('client token cannot create admins', async () => {
  const clientToken = await loginAndGetToken(
    baseUrl,
    'cliente@teste.com',
    '123456'
  );

  const { response } = await apiRequest(baseUrl, '/api/auth/admins', {
    method: 'POST',
    headers: buildAuthHeaders(clientToken),
    body: JSON.stringify({
      nome: 'Tentativa Admin',
      email: `admin-${Date.now()}@teste.com`,
      senha: '123456',
      telefone: '85999998888',
    }),
  });

  assert.equal(response.status, 403);
});
