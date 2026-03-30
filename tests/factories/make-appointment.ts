import { AppointmentStatus } from '@prisma/client';
import { addDays } from 'date-fns';
import { prisma } from '../../src/core/database/prisma.js';
import { trackEntityId } from '../helpers/db.js';

interface MakeAppointmentInput {
  barbeariaId: string;
  profissionalId: string;
  clienteId: string;
  servicoId: string;
  dataHora?: Date;
  status?: AppointmentStatus;
  precoCobrado?: number;
  duracaoMinutos?: number;
  concluidoEm?: Date | null;
  canceladoEm?: Date | null;
}

export const makeAppointment = async (input: MakeAppointmentInput) => {
  const appointment = await prisma.agendamento.create({
    data: {
      dataHora: input.dataHora ?? addDays(new Date(), 1),
      status: input.status ?? AppointmentStatus.CONFIRMADO,
      precoCobrado: input.precoCobrado ?? 45,
      duracaoMinutos: input.duracaoMinutos ?? 30,
      concluidoEm: input.concluidoEm ?? null,
      canceladoEm: input.canceladoEm ?? null,
      barbeariaId: input.barbeariaId,
      profissionalId: input.profissionalId,
      clienteId: input.clienteId,
      servicoId: input.servicoId,
    },
  });

  trackEntityId('appointments', appointment.id);

  return appointment;
};
