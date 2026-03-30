import assert from 'node:assert/strict';
import { apiRequest, isObjectRecord } from './app.js';

export const buildAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const loginAndGetToken = async (
  baseUrl: string,
  email: string,
  senha: string
) => {
  const { response, body } = await apiRequest(baseUrl, '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });

  assert.equal(response.status, 200);
  assert.equal(isObjectRecord(body), true);

  if (!isObjectRecord(body) || !isObjectRecord(body.data)) {
    throw new Error('Resposta de login fora do contrato esperado.');
  }

  if (typeof body.data.token !== 'string') {
    throw new Error('Token nao retornado pelo endpoint de login.');
  }

  return body.data.token;
};
