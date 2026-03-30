import type { Prisma } from '@prisma/client';
import { decimalToNumber } from '../../core/utils/decimal.js';
import type {
  AppointmentDetail,
  AppointmentHistoryItem,
} from './appointment.types.js';

const presentService = (
  service:
    | {
        nome: string;
        preco: Prisma.Decimal;
        duracaoMinutos: number;
      }
    | null
) => {
  if (!service) {
    return null;
  }

  return {
    ...service,
    preco: decimalToNumber(service.preco),
  };
};

export const presentAppointment = (appointment: AppointmentDetail) => ({
  ...appointment,
  precoCobrado: decimalToNumber(appointment.precoCobrado),
  servico: presentService(appointment.servico),
});

export const presentAppointmentHistory = (
  appointment: AppointmentHistoryItem
) => ({
  ...appointment,
  precoCobrado: decimalToNumber(appointment.precoCobrado),
  servico: presentService(appointment.servico),
});
