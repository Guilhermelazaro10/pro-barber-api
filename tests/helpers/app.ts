import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { addDays, format } from 'date-fns';
import { app } from '../../src/app.js';

type TestServer = ReturnType<typeof app.listen>;

interface ApiRequestResult {
  response: Response;
  body: unknown;
}

export const isObjectRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const startTestServer = async () => {
  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address() as AddressInfo | null;

  if (!address) {
    throw new Error('Nao foi possivel iniciar o servidor de teste.');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    server,
  };
};

export const stopTestServer = async (server: TestServer) => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

export const apiRequest = async (
  baseUrl: string,
  path: string,
  options: RequestInit = {}
): Promise<ApiRequestResult> => {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });
  const rawBody = await response.text();
  const body = rawBody.length > 0 ? (JSON.parse(rawBody) as unknown) : null;

  return {
    response,
    body,
  };
};

export const findFirstAvailableSlot = async (
  baseUrl: string,
  professionalId: string,
  serviceId: string
) => {
  for (let offset = 1; offset <= 14; offset += 1) {
    const date = format(addDays(new Date(), offset), 'yyyy-MM-dd');
    const query = new URLSearchParams({
      profissionalId: professionalId,
      servicoId: serviceId,
      data: date,
    });
    const { response, body } = await apiRequest(
      baseUrl,
      `/api/agendamentos/disponibilidade?${query.toString()}`
    );

    if (response.status !== 200) {
      continue;
    }

    if (
      typeof body === 'object' &&
      body !== null &&
      'data' in body &&
      Array.isArray(body.data) &&
      typeof body.data[0] === 'string'
    ) {
      return {
        date,
        time: body.data[0],
      };
    }
  }

  throw new Error('Nenhum horario disponivel encontrado para os testes.');
};
