import { AppointmentStatus } from '@prisma/client';
import {
  addMinutes,
  endOfDay,
  format,
  isPast,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
  startOfDay,
  subHours,
} from 'date-fns';
import { prisma } from '../lib/prisma.js';
import {
  serializeAppointment,
  serializeAppointmentHistory,
} from '../presenters/appointment-presenter.js';
import type { AuthenticatedUser } from '../types/auth.js';
import { AppError } from '../utils/app-error.js';

const ACTIVE_APPOINTMENT_STATUSES = [
  AppointmentStatus.PENDENTE,
  AppointmentStatus.CONFIRMADO,
];

const SLOT_INTERVAL_MINUTES = 30;
const WORKING_WINDOWS = [
  { startHour: 8, endHour: 12 },
  { startHour: 14, endHour: 18 },
] as const;

const hasOverlap = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) => startA < endB && startB < endA;

const parseIsoDate = (value: string, errorMessage: string) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(errorMessage, 400);
  }

  return parsedDate;
};

export class AppointmentService {
  private buildSlotCandidates(date: Date, durationInMinutes: number) {
    return WORKING_WINDOWS.flatMap(({ startHour, endHour }) => {
      const sessionStart = setMilliseconds(
        setSeconds(setMinutes(setHours(new Date(date), startHour), 0), 0),
        0
      );
      const sessionEnd = setMilliseconds(
        setSeconds(setMinutes(setHours(new Date(date), endHour), 0), 0),
        0
      );
      const slots: Date[] = [];

      for (
        let slot = sessionStart;
        addMinutes(slot, durationInMinutes) <= sessionEnd;
        slot = addMinutes(slot, SLOT_INTERVAL_MINUTES)
      ) {
        slots.push(slot);
      }

      return slots;
    });
  }

  async create(data: {
    user: AuthenticatedUser;
    date: string;
    profissionalId: string;
    servicoId: string;
  }) {
    const dataAg = parseIsoDate(data.date, 'Data do agendamento invalida.');

    if (isPast(dataAg)) {
      throw new AppError('Nao e possivel realizar um agendamento em uma data passada.');
    }

    const [profissional, servico] = await Promise.all([
      prisma.profissional.findFirst({
        where: {
          id: data.profissionalId,
          barbeariaId: data.user.barbeariaId,
        },
        select: {
          id: true,
          nome: true,
        },
      }),
      prisma.servico.findFirst({
        where: {
          id: data.servicoId,
          barbeariaId: data.user.barbeariaId,
        },
        select: {
          id: true,
          nome: true,
          preco: true,
          duracaoMinutos: true,
        },
      }),
    ]);

    if (!profissional) {
      throw new AppError('Profissional nao encontrado para a sua barbearia.', 404);
    }

    if (!servico) {
      throw new AppError('Servico nao encontrado para a sua barbearia.', 404);
    }

    const requestedEnd = addMinutes(dataAg, servico.duracaoMinutos);

    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${data.profissionalId}))`;

      const existingAppointments = await tx.agendamento.findMany({
        where: {
          profissionalId: data.profissionalId,
          status: {
            in: ACTIVE_APPOINTMENT_STATUSES,
          },
          dataHora: {
            gte: startOfDay(dataAg),
            lte: endOfDay(dataAg),
          },
        },
        select: {
          id: true,
          dataHora: true,
          duracaoMinutos: true,
        },
      });

      const conflito = existingAppointments.find((appointment) =>
        hasOverlap(
          appointment.dataHora,
          addMinutes(appointment.dataHora, appointment.duracaoMinutos),
          dataAg,
          requestedEnd
        )
      );

      if (conflito) {
        throw new AppError('Este horario ja esta ocupado para este profissional.', 409);
      }

      const appointment = await tx.agendamento.create({
        data: {
          dataHora: dataAg,
          status: AppointmentStatus.CONFIRMADO,
          precoCobrado: servico.preco,
          duracaoMinutos: servico.duracaoMinutos,
          clienteId: data.user.id,
          profissionalId: data.profissionalId,
          servicoId: data.servicoId,
          barbeariaId: data.user.barbeariaId,
        },
        include: {
          profissional: { select: { nome: true } },
          servico: { select: { nome: true, preco: true, duracaoMinutos: true } },
        },
      });

      return serializeAppointment(appointment);
    });
  }

  async findAllByUser(user: AuthenticatedUser) {
    const appointments = await prisma.agendamento.findMany({
      where: {
        clienteId: user.id,
        barbeariaId: user.barbeariaId,
      },
      include: {
        barbearia: { select: { nomeFantasia: true } },
        profissional: { select: { nome: true } },
        servico: { select: { nome: true, preco: true, duracaoMinutos: true } },
      },
      orderBy: { dataHora: 'desc' },
    });

    return appointments.map(serializeAppointmentHistory);
  }

  async getAvailability(profissionalId: string, date: string, servicoId?: string) {
    const selectedDate = parseIsoDate(`${date}T00:00:00`, 'Data para consulta invalida.');

    const profissional = await prisma.profissional.findUnique({
      where: { id: profissionalId },
      select: {
        id: true,
        barbeariaId: true,
      },
    });

    if (!profissional) {
      throw new AppError('Profissional nao encontrado.', 404);
    }

    let requestedDuration = 30;

    if (servicoId) {
      const servico = await prisma.servico.findFirst({
        where: {
          id: servicoId,
          barbeariaId: profissional.barbeariaId,
        },
        select: {
          duracaoMinutos: true,
        },
      });

      if (!servico) {
        throw new AppError('Servico nao encontrado para este profissional.', 404);
      }

      requestedDuration = servico.duracaoMinutos;
    }

    const appointments = await prisma.agendamento.findMany({
      where: {
        profissionalId,
        status: {
          in: ACTIVE_APPOINTMENT_STATUSES,
        },
        dataHora: {
          gte: startOfDay(selectedDate),
          lte: endOfDay(selectedDate),
        },
      },
      select: {
        dataHora: true,
        duracaoMinutos: true,
      },
    });

    const now = new Date();
    const slots = this.buildSlotCandidates(selectedDate, requestedDuration);

    return slots
      .filter((slotStart) => {
        const slotEnd = addMinutes(slotStart, requestedDuration);

        if (slotStart <= now) {
          return false;
        }

        return !appointments.some((appointment) =>
          hasOverlap(
            appointment.dataHora,
            addMinutes(appointment.dataHora, appointment.duracaoMinutos),
            slotStart,
            slotEnd
          )
        );
      })
      .map((slotStart) => format(slotStart, 'HH:mm'));
  }

  async cancel(appointmentId: string, user: AuthenticatedUser) {
    const appointment = await prisma.agendamento.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new AppError('Agendamento nao encontrado.', 404);
    }

    if (
      appointment.clienteId !== user.id ||
      appointment.barbeariaId !== user.barbeariaId
    ) {
      throw new AppError('Nao autorizado para cancelar este agendamento.', 403);
    }

    if (appointment.status === AppointmentStatus.CANCELADO) {
      throw new AppError('Este agendamento ja foi cancelado.', 409);
    }

    if (appointment.status === AppointmentStatus.CONCLUIDO) {
      throw new AppError('Nao e possivel cancelar um agendamento concluido.', 409);
    }

    const limiteCancelamento = subHours(appointment.dataHora, 2);

    if (isPast(limiteCancelamento)) {
      throw new AppError(
        'O cancelamento so e permitido com no minimo 2 horas de antecedencia.'
      );
    }

    return prisma.agendamento.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELADO,
        canceladoEm: new Date(),
      },
    });
  }

  async complete(appointmentId: string, user: AuthenticatedUser) {
    const currentAppointment = await prisma.agendamento.findUnique({
      where: { id: appointmentId },
    });

    if (!currentAppointment) {
      throw new AppError('Agendamento nao encontrado.', 404);
    }

    if (currentAppointment.barbeariaId !== user.barbeariaId) {
      throw new AppError('Nao autorizado para concluir este agendamento.', 403);
    }

    if (currentAppointment.status === AppointmentStatus.CANCELADO) {
      throw new AppError('Nao e possivel concluir um agendamento cancelado.', 409);
    }

    if (currentAppointment.status === AppointmentStatus.CONCLUIDO) {
      throw new AppError('Este agendamento ja foi concluido.', 409);
    }

    if (currentAppointment.dataHora > new Date()) {
      throw new AppError('Nao e possivel concluir um agendamento futuro.', 409);
    }

    const appointment = await prisma.agendamento.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CONCLUIDO,
        concluidoEm: new Date(),
      },
      include: {
        profissional: { select: { nome: true } },
        servico: { select: { nome: true, preco: true, duracaoMinutos: true } },
      },
    });

    return serializeAppointment(appointment);
  }
}
