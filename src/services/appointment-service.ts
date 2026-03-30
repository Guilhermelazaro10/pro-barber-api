import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import { subHours, isPast } from 'date-fns';

export class AppointmentService {
  // GET /profissionais/:id/horarios-disponiveis
  async getAvailability(professionalId: string, date: string) {
    const slots = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
    
    const appointments = await prisma.agendamento.findMany({
      where: {
        profissionalId,
        status: { not: 'CANCELADO' },
        dataHora: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lte: new Date(`${date}T23:59:59.999Z`),
        }
      }
    });

    const busyHours = appointments.map(a => a.dataHora.toISOString().substring(11, 16));
    return slots.filter(slot => !busyHours.includes(slot));
  }

  // PATCH /agendamentos/:id/cancelar com verificação de dono
  async cancel(appointmentId: string, userId: string) {
    const appointment = await prisma.agendamento.findUnique({ where: { id: appointmentId } });

    if (!appointment) throw new AppError("Agendamento não encontrado", 404);
    if (appointment.clienteId !== userId) throw new AppError("Não autorizado: você não é o dono deste agendamento", 403);

    // Regra SaaS: Não cancela se faltar menos de 2h
    if (isPast(subHours(appointment.dataHora, 2))) {
      throw new AppError("Cancelamento permitido apenas com 2 horas de antecedência");
    }

    return await prisma.agendamento.update({
      where: { id: appointmentId },
      data: { status: 'CANCELADO' }
    });
  }

  // Top Serviços (Otimizado: GroupBy)
  async getTopServices(professionalId: string) {
    const top = await prisma.agendamento.groupBy({
      by: ['servicoId'],
      where: { profissionalId, status: 'CONCLUIDO' },
      _count: { servicoId: true },
      orderBy: { _count: { servicoId: 'desc' } },
      take: 3
    });

    const services = await prisma.servico.findMany({
      where: { id: { in: top.map(t => t.servicoId) } },
      select: { id: true, nome: true }
    });

    return top.map(t => ({
      nome: services.find(s => s.id === t.servicoId)?.nome,
      total: t._count.servicoId
    }));
  }
}