import type { Prisma } from '@prisma/client';
import { decimalToNumber } from '../utils/decimal.js';

type AppointmentWithRelations = Prisma.AgendamentoGetPayload<{
  include: {
    barbearia: { select: { nomeFantasia: true } };
    profissional: { select: { nome: true } };
    servico: { select: { nome: true; preco: true; duracaoMinutos: true } };
  };
}>;

type AppointmentWithService = Prisma.AgendamentoGetPayload<{
  include: {
    profissional: { select: { nome: true } };
    servico: { select: { nome: true; preco: true; duracaoMinutos: true } };
  };
}>;

const serializeService = (
  servico: { nome: string; preco: Prisma.Decimal; duracaoMinutos: number } | null
) => {
  if (!servico) {
    return servico;
  }

  return {
    ...servico,
    preco: decimalToNumber(servico.preco),
  };
};

export const serializeAppointment = (appointment: AppointmentWithService) => ({
  ...appointment,
  precoCobrado: decimalToNumber(appointment.precoCobrado),
  servico: serializeService(appointment.servico),
});

export const serializeAppointmentHistory = (
  appointment: AppointmentWithRelations
) => ({
  ...appointment,
  precoCobrado: decimalToNumber(appointment.precoCobrado),
  servico: serializeService(appointment.servico),
});
