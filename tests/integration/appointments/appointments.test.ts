import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';
import { addDays, addHours, setHours, setMinutes, setSeconds } from 'date-fns';
import { buildAuthHeaders, loginAndGetToken } from '../../helpers/auth.js';
import {
  apiRequest,
  findFirstAvailableSlot,
  isObjectRecord,
  startTestServer,
  stopTestServer,
} from '../../helpers/app.js';
import {
  cleanupTrackedData,
  getSeedBarbershopContext,
  getSeedUserByEmail,
  trackEntityId,
} from '../../helpers/db.js';
import { makeAppointment } from '../../factories/make-appointment.js';
import { makeBarbershop } from '../../factories/make-barbershop.js';
import { makeProfessional } from '../../factories/make-professional.js';
import { makeService } from '../../factories/make-service.js';
import { makeUser } from '../../factories/make-user.js';

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

test('public availability endpoint responds for frontend scheduling', async () => {
  const seedContext = await getSeedBarbershopContext();
  const availableSlot = await findFirstAvailableSlot(
    baseUrl,
    seedContext.professionalId,
    seedContext.serviceId
  );

  assert.match(availableSlot.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(availableSlot.time, /^\d{2}:\d{2}$/);
});

test('appointment creation prevents schedule conflicts', async () => {
  const seedContext = await getSeedBarbershopContext();
  const firstUser = await makeUser({
    barbeariaId: seedContext.barbeariaId,
  });
  const secondUser = await makeUser({
    barbeariaId: seedContext.barbeariaId,
  });

  const firstToken = await loginAndGetToken(
    baseUrl,
    firstUser.email,
    firstUser.plainPassword
  );
  const secondToken = await loginAndGetToken(
    baseUrl,
    secondUser.email,
    secondUser.plainPassword
  );
  const availableSlot = await findFirstAvailableSlot(
    baseUrl,
    seedContext.professionalId,
    seedContext.serviceId
  );
  const appointmentDateTime = `${availableSlot.date}T${availableSlot.time}:00.000-03:00`;

  const { response: firstResponse, body: firstBody } = await apiRequest(
    baseUrl,
    '/api/agendamentos',
    {
      method: 'POST',
      headers: buildAuthHeaders(firstToken),
      body: JSON.stringify({
        dataHora: appointmentDateTime,
        profissionalId: seedContext.professionalId,
        servicoId: seedContext.serviceId,
      }),
    }
  );

  assert.equal(firstResponse.status, 201);
  assert.equal(isObjectRecord(firstBody), true);

  if (!isObjectRecord(firstBody) || !isObjectRecord(firstBody.data)) {
    throw new Error('Resposta de agendamento fora do contrato esperado.');
  }

  if (typeof firstBody.data.id !== 'string') {
    throw new Error('ID do agendamento nao retornado.');
  }

  trackEntityId('appointments', firstBody.data.id);

  const { response: conflictResponse } = await apiRequest(
    baseUrl,
    '/api/agendamentos',
    {
      method: 'POST',
      headers: buildAuthHeaders(secondToken),
      body: JSON.stringify({
        dataHora: appointmentDateTime,
        profissionalId: seedContext.professionalId,
        servicoId: seedContext.serviceId,
      }),
    }
  );

  assert.equal(conflictResponse.status, 409);
});

test('cancel endpoint blocks requests outside the allowed window', async () => {
  const seedContext = await getSeedBarbershopContext();
  const user = await makeUser({
    barbeariaId: seedContext.barbeariaId,
  });
  const token = await loginAndGetToken(baseUrl, user.email, user.plainPassword);
  const appointment = await makeAppointment({
    barbeariaId: seedContext.barbeariaId,
    profissionalId: seedContext.professionalId,
    clienteId: user.id,
    servicoId: seedContext.serviceId,
    dataHora: addHours(new Date(), 1),
  });

  const { response } = await apiRequest(
    baseUrl,
    `/api/agendamentos/${appointment.id}/cancelar`,
    {
      method: 'PATCH',
      headers: buildAuthHeaders(token),
    }
  );

  assert.equal(response.status, 409);
});

test('complete endpoint rejects future appointments', async () => {
  const seedContext = await getSeedBarbershopContext();
  const seedClient = await getSeedUserByEmail('cliente@teste.com');
  const appointment = await makeAppointment({
    barbeariaId: seedContext.barbeariaId,
    profissionalId: seedContext.professionalId,
    clienteId: seedClient.id,
    servicoId: seedContext.serviceId,
    dataHora: addDays(new Date(), 1),
  });
  const adminToken = await loginAndGetToken(baseUrl, 'admin@teste.com', '123456');

  const { response } = await apiRequest(
    baseUrl,
    `/api/agendamentos/${appointment.id}/concluir`,
    {
      method: 'PATCH',
      headers: buildAuthHeaders(adminToken),
    }
  );

  assert.equal(response.status, 409);
});

test('tenant isolation blocks cross-barbershop booking attempts', async () => {
  const seedContext = await getSeedBarbershopContext();
  const otherBarbershop = await makeBarbershop();
  const otherProfessional = await makeProfessional({
    barbeariaId: otherBarbershop.id,
  });
  const otherService = await makeService({
    barbeariaId: otherBarbershop.id,
  });
  const clientToken = await loginAndGetToken(
    baseUrl,
    'cliente@teste.com',
    '123456'
  );
  const futureDate = setSeconds(
    setMinutes(setHours(addDays(new Date(), 2), 10), 0),
    0
  ).toISOString();

  const { response } = await apiRequest(baseUrl, '/api/agendamentos', {
    method: 'POST',
    headers: buildAuthHeaders(clientToken),
    body: JSON.stringify({
      dataHora: futureDate,
      profissionalId: otherProfessional.id,
      servicoId: otherService.id,
      expectedBarbeariaId: seedContext.barbeariaId,
    }),
  });

  assert.equal(response.status, 404);
});
