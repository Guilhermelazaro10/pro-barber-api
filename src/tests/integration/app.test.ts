import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { addDays, format } from 'date-fns';
import { app } from '../../app.js';

let baseUrl = '';
let server: ReturnType<typeof app.listen>;

const apiRequest = async (
  path: string,
  options: RequestInit = {}
) => {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });
  const rawBody = await response.text();
  const body = rawBody ? JSON.parse(rawBody) : null;

  return { response, body };
};

const login = async (email: string, senha: string) => {
  const { response, body } = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });

  assert.equal(response.status, 200);
  assert.equal(body.success, true);

  return body.data.token as string;
};

const findFirstAvailableSlot = async (
  profissionalId: string,
  servicoId: string
) => {
  for (let offset = 1; offset <= 14; offset += 1) {
    const date = format(addDays(new Date(), offset), 'yyyy-MM-dd');
    const query = new URLSearchParams({
      profissionalId,
      servicoId,
      data: date,
    });
    const { response, body } = await apiRequest(
      `/api/agendamentos/disponibilidade?${query.toString()}`
    );

    assert.equal(response.status, 200);

    if (Array.isArray(body.data) && body.data.length > 0) {
      return {
        date,
        time: body.data[0] as string,
      };
    }
  }

  throw new Error('Nenhum horario disponivel encontrado para os testes.');
};

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  const address = server.address() as AddressInfo | null;

  if (!address) {
    throw new Error('Nao foi possivel iniciar o servidor de teste.');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test('API contracts stay ready for frontend integration', async () => {
  const { response: barbershopResponse, body: barbershopBody } = await apiRequest(
    '/api/barbearias/probarber-matriz'
  );

  assert.equal(barbershopResponse.status, 200);
  assert.equal(barbershopBody.success, true);
  assert.ok(barbershopResponse.headers.get('x-request-id'));
  assert.ok(Array.isArray(barbershopBody.data.profissionais));
  assert.ok(Array.isArray(barbershopBody.data.servicos));

  const profissionalId = barbershopBody.data.profissionais[0]?.id as string;
  const servicoId = barbershopBody.data.servicos[0]?.id as string;
  const barbeariaId = barbershopBody.data.id as string;
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const clienteEmail = `cliente-${uniqueSuffix}@teste.com`;
  const adminEmail = `admin-${uniqueSuffix}@teste.com`;

  const registerPayload = {
    nome: 'Cliente Front',
    email: clienteEmail,
    senha: '123456',
    telefone: '85988888888',
    barbeariaId,
  };

  const { response: registerResponse, body: registerBody } = await apiRequest(
    '/api/auth/cadastro',
    {
      method: 'POST',
      body: JSON.stringify(registerPayload),
    }
  );

  assert.equal(registerResponse.status, 201);
  assert.equal(registerBody.data.role, 'CLIENTE');

  const clienteToken = await login(clienteEmail, '123456');

  const { response: meResponse, body: meBody } = await apiRequest('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${clienteToken}`,
    },
  });

  assert.equal(meResponse.status, 200);
  assert.equal(meBody.data.email, clienteEmail);
  assert.equal(meBody.data.role, 'CLIENTE');

  const availableSlot = await findFirstAvailableSlot(profissionalId, servicoId);
  const appointmentDateTime = `${availableSlot.date}T${availableSlot.time}:00.000-03:00`;

  const { response: appointmentResponse, body: appointmentBody } = await apiRequest(
    '/api/agendamentos',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clienteToken}`,
      },
      body: JSON.stringify({
        dataHora: appointmentDateTime,
        profissionalId,
        servicoId,
      }),
    }
  );

  assert.equal(appointmentResponse.status, 201);
  assert.equal(typeof appointmentBody.data.precoCobrado, 'number');
  assert.equal(typeof appointmentBody.data.servico.preco, 'number');

  const { response: historyResponse, body: historyBody } = await apiRequest(
    '/api/agendamentos/meus',
    {
      headers: {
        Authorization: `Bearer ${clienteToken}`,
      },
    }
  );

  assert.equal(historyResponse.status, 200);
  assert.ok(
    historyBody.data.some(
      (appointment: { id: string }) => appointment.id === appointmentBody.data.id
    )
  );

  const { response: cancelResponse, body: cancelBody } = await apiRequest(
    `/api/agendamentos/${appointmentBody.data.id}/cancelar`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${clienteToken}`,
      },
    }
  );

  assert.equal(cancelResponse.status, 200);
  assert.equal(cancelBody.success, true);

  const { response: forbiddenFinanceResponse } = await apiRequest(
    `/api/financeiro/profissional/${profissionalId}`,
    {
      headers: {
        Authorization: `Bearer ${clienteToken}`,
      },
    }
  );

  assert.equal(forbiddenFinanceResponse.status, 403);

  const adminToken = await login('admin@teste.com', '123456');

  const { response: createAdminResponse, body: createAdminBody } = await apiRequest(
    '/api/auth/admins',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        nome: 'Admin Front',
        email: adminEmail,
        senha: '123456',
        telefone: '85997777777',
      }),
    }
  );

  assert.equal(createAdminResponse.status, 201);
  assert.equal(createAdminBody.data.role, 'ADMIN');

  const { response: financeResponse, body: financeBody } = await apiRequest(
    `/api/financeiro/profissional/${profissionalId}`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );

  assert.equal(financeResponse.status, 200);
  assert.equal(typeof financeBody.data.faturamentoTotal, 'number');
  assert.equal(typeof financeBody.data.valorComissao, 'number');
});
