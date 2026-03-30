import { prisma } from '../../src/core/database/prisma.js';

type TrackedEntity =
  | 'appointments'
  | 'users'
  | 'professionals'
  | 'services'
  | 'barbershops';

const trackedIds: Record<TrackedEntity, Set<string>> = {
  appointments: new Set<string>(),
  users: new Set<string>(),
  professionals: new Set<string>(),
  services: new Set<string>(),
  barbershops: new Set<string>(),
};

export const makeUniqueValue = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const trackEntityId = (entity: TrackedEntity, id: string) => {
  trackedIds[entity].add(id);
};

export const cleanupTrackedData = async () => {
  if (trackedIds.appointments.size > 0) {
    await prisma.agendamento.deleteMany({
      where: {
        id: {
          in: Array.from(trackedIds.appointments),
        },
      },
    });
    trackedIds.appointments.clear();
  }

  if (trackedIds.users.size > 0) {
    await prisma.cliente.deleteMany({
      where: {
        id: {
          in: Array.from(trackedIds.users),
        },
      },
    });
    trackedIds.users.clear();
  }

  if (trackedIds.professionals.size > 0) {
    await prisma.profissional.deleteMany({
      where: {
        id: {
          in: Array.from(trackedIds.professionals),
        },
      },
    });
    trackedIds.professionals.clear();
  }

  if (trackedIds.services.size > 0) {
    await prisma.servico.deleteMany({
      where: {
        id: {
          in: Array.from(trackedIds.services),
        },
      },
    });
    trackedIds.services.clear();
  }

  if (trackedIds.barbershops.size > 0) {
    await prisma.barbearia.deleteMany({
      where: {
        id: {
          in: Array.from(trackedIds.barbershops),
        },
      },
    });
    trackedIds.barbershops.clear();
  }
};

export const getSeedBarbershopContext = async () => {
  const barbershop = await prisma.barbearia.findUnique({
    where: {
      slugUrl: 'probarber-matriz',
    },
    select: {
      id: true,
      profissionais: {
        select: {
          id: true,
        },
        orderBy: {
          nome: 'asc',
        },
        take: 1,
      },
      servicos: {
        select: {
          id: true,
        },
        orderBy: {
          nome: 'asc',
        },
        take: 1,
      },
    },
  });

  if (!barbershop) {
    throw new Error('Barbearia seed "probarber-matriz" nao encontrada.');
  }

  const professional = barbershop.profissionais[0];
  const service = barbershop.servicos[0];

  if (!professional || !service) {
    throw new Error('Contexto seed incompleto para profissionais ou servicos.');
  }

  return {
    barbeariaId: barbershop.id,
    professionalId: professional.id,
    serviceId: service.id,
  };
};

export const getSeedUserByEmail = async (email: string) => {
  const user = await prisma.cliente.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      barbeariaId: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error(`Usuario seed nao encontrado para o email ${email}.`);
  }

  return user;
};
