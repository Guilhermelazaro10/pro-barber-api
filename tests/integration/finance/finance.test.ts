import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';
import { AppointmentStatus } from '@prisma/client';
import { addDays } from 'date-fns';
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
  getSeedUserByEmail,
} from '../../helpers/db.js';
import { makeAppointment } from '../../factories/make-appointment.js';
import { makeBarbershop } from '../../factories/make-barbershop.js';
import { makeProfessional } from '../../factories/make-professional.js';

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

test('finance endpoints remain blocked for client users', async () => {
  const seedContext = await getSeedBarbershopContext();
  const clientToken = await loginAndGetToken(
    baseUrl,
    'cliente@teste.com',
    '123456'
  );

  const { response } = await apiRequest(
    baseUrl,
    `/api/financeiro/profissional/${seedContext.professionalId}`,
    {
      headers: buildAuthHeaders(clientToken),
    }
  );

  assert.equal(response.status, 403);
});

test('finance report and ranking work for admin users', async () => {
  const seedContext = await getSeedBarbershopContext();
  const seedClient = await getSeedUserByEmail('cliente@teste.com');
  await makeAppointment({
    barbeariaId: seedContext.barbeariaId,
    profissionalId: seedContext.professionalId,
    clienteId: seedClient.id,
    servicoId: seedContext.serviceId,
    dataHora: addDays(new Date(), -1),
    status: AppointmentStatus.CONCLUIDO,
    concluidoEm: new Date(),
  });
  const adminToken = await loginAndGetToken(baseUrl, 'admin@teste.com', '123456');

  const { response: reportResponse, body: reportBody } = await apiRequest(
    baseUrl,
    `/api/financeiro/profissional/${seedContext.professionalId}`,
    {
      headers: buildAuthHeaders(adminToken),
    }
  );

  assert.equal(reportResponse.status, 200);
  assert.equal(isObjectRecord(reportBody), true);

  if (!isObjectRecord(reportBody) || !isObjectRecord(reportBody.data)) {
    throw new Error('Resposta do relatorio financeiro fora do contrato esperado.');
  }

  assert.equal(typeof reportBody.data.faturamentoTotal, 'number');
  assert.equal(typeof reportBody.data.valorComissao, 'number');
  assert.ok(
    typeof reportBody.data.totalAtendimentos === 'number' &&
      reportBody.data.totalAtendimentos >= 1
  );

  const { response: rankingResponse, body: rankingBody } = await apiRequest(
    baseUrl,
    `/api/financeiro/profissional/${seedContext.professionalId}/top-servicos`,
    {
      headers: buildAuthHeaders(adminToken),
    }
  );

  assert.equal(rankingResponse.status, 200);
  assert.equal(isObjectRecord(rankingBody), true);

  if (!isObjectRecord(rankingBody)) {
    throw new Error('Resposta do ranking financeiro fora do contrato esperado.');
  }

  assert.ok(Array.isArray(rankingBody.data));
  assert.ok(rankingBody.data.length >= 1);
});

test('finance scope does not leak cross-tenant professionals', async () => {
  const otherBarbershop = await makeBarbershop();
  const otherProfessional = await makeProfessional({
    barbeariaId: otherBarbershop.id,
  });
  const adminToken = await loginAndGetToken(baseUrl, 'admin@teste.com', '123456');

  const { response } = await apiRequest(
    baseUrl,
    `/api/financeiro/profissional/${otherProfessional.id}`,
    {
      headers: buildAuthHeaders(adminToken),
    }
  );

  assert.equal(response.status, 404);
});
