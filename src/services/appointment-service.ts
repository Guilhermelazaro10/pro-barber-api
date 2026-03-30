import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import { subHours, isPast, startOfDay, endOfDay } from 'date-fns';

export class AppointmentService {
  /**
   * Cria um novo agendamento com validação de conflito
   */
  async create(data: { userId: string; date: string; profissionalId: string; serviceId: string; barbeariaId: string }) {
    const dataAg = new Date(data.date);

    // 1. Impedir agendamento no passado
    if (isPast(dataAg)) {
      throw new AppError("Não é possível realizar um agendamento em uma data passada.");
    }

    // 2. Verificar se o horário já está ocupado por aquele profissional
    const conflito = await prisma.agendamento.findFirst({
      where: {
        profissionalId: data.profissionalId,
        dataHora: dataAg,
        status: { not: 'CANCELADO' }
      }
    });

    if (conflito) {
      throw new AppError("Este horário já está ocupado para este profissional.", 409);
    }

    return await prisma.agendamento.create({
      data: {
        dataHora: dataAg,
        clienteId: data.userId,
        profissionalId: data.profissionalId,
        servicoId: data.serviceId,
        barbeariaId: data.barbeariaId,
      },
      include: {
        profissional: { select: { nome: true } },
        servico: { select: { nome: true, preco: true } }
      }
    });
  }

  /**
   * Retorna todos os agendamentos de um cliente específico (Histórico)
   */
  async findAllByUser(userId: string) {
    return await prisma.agendamento.findMany({
      where: { clienteId: userId },
      include: {
        barbearia: { select: { nomeFantasia: true } },
        profissional: { select: { nome: true } },
        servico: { select: { nome: true, preco: true } }
      },
      orderBy: { dataHora: 'desc' }
    });
  }

  /**
   * Calcula horários disponíveis para um profissional em uma data específica
   */
  async getAvailability(profissionalId: string, date: string) {
    const slots = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
    
    // Busca agendamentos entre o início e o fim do dia informado
    const appointments = await prisma.agendamento.findMany({
      where: {
        profissionalId,
        status: { not: 'CANCELADO' },
        dataHora: {
          gte: startOfDay(new Date(date)),
          lte: endOfDay(new Date(date)),
        }
      }
    });

    const busyHours = appointments.map(a => a.dataHora.toISOString().substring(11, 16));
    return slots.filter(slot => !busyHours.includes(slot));
  }

  /**
   * Cancela um agendamento com regra de 2 horas de antecedência
   */
  async cancel(appointmentId: string, userId: string) {
    const appointment = await prisma.agendamento.findUnique({ where: { id: appointmentId } });

    if (!appointment) throw new AppError("Agendamento não encontrado", 404);
    
    // Validação de Propriedade: Segurança do SaaS
    if (appointment.clienteId !== userId) {
      throw new AppError("Não autorizado: este agendamento pertence a outro cliente", 403);
    }

    // Regra de Negócio: Cancelamento permitido apenas até 2h antes
    const limiteCancelamento = subHours(appointment.dataHora, 2);
    if (isPast(limiteCancelamento)) {
      throw new AppError("O cancelamento só é permitido com no mínimo 2 horas de antecedência.");
    }

    return await prisma.agendamento.update({
      where: { id: appointmentId },
      data: { status: 'CANCELADO' }
    });
  }

  /**
   * Ranking de serviços mais realizados (Performance Otimizada)
   */
  async getTopServices(profissionalId: string) {
    const top = await prisma.agendamento.groupBy({
      by: ['servicoId'],
      where: { profissionalId, status: 'CONCLUIDO' },
      _count: { servicoId: true },
      orderBy: { _count: { servicoId: 'desc' } },
      take: 3
    });

    const serviceIds = top.map(t => t.servicoId);
    const services = await prisma.servico.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, nome: true }
    });

    return top.map(t => ({
      nome: services.find(s => s.id === t.servicoId)?.nome || "Serviço Removido",
      total: t._count.servicoId
    }));
  }
}