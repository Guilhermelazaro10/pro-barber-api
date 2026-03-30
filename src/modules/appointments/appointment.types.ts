import type { Prisma } from '@prisma/client';

export const appointmentDetailInclude = {
  profissional: {
    select: {
      nome: true,
    },
  },
  servico: {
    select: {
      nome: true,
      preco: true,
      duracaoMinutos: true,
    },
  },
} satisfies Prisma.AgendamentoInclude;

export const appointmentHistoryInclude = {
  barbearia: {
    select: {
      nomeFantasia: true,
    },
  },
  profissional: {
    select: {
      nome: true,
    },
  },
  servico: {
    select: {
      nome: true,
      preco: true,
      duracaoMinutos: true,
    },
  },
} satisfies Prisma.AgendamentoInclude;

export type AppointmentDetail = Prisma.AgendamentoGetPayload<{
  include: typeof appointmentDetailInclude;
}>;

export type AppointmentHistoryItem = Prisma.AgendamentoGetPayload<{
  include: typeof appointmentHistoryInclude;
}>;
