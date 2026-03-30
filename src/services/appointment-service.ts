import { prisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';

export class AppointmentService {
  async create(data: { userId: string; date: string; professionalId: string; serviceId: string; shopId: string }) {
    const dataAg = new Date(data.date);

    // Regra: Não agendar no passado
    if (dataAg < new Date()) throw new AppError("Não é possível agendar em data passada.");

    const conflito = await prisma.agendamento.findFirst({
      where: { profissionalId: data.professionalId, dataHora: dataAg, status: { not: 'CANCELADO' } }
    });

    if (conflito) throw new AppError("Este profissional já possui um agendamento neste horário.", 409);

    return await prisma.agendamento.create({
      data: {
        dataHora: dataAg,
        clienteId: data.userId,
        profissionalId: data.professionalId,
        servicoId: data.serviceId,
        barbeariaId: data.shopId,
      }
    });
  }

  async cancel(appointmentId: string, userId: string) {
    const appointment = await prisma.agendamento.findUnique({ where: { id: appointmentId } });

    if (!appointment) throw new AppError("Agendamento não encontrado.", 404);
    if (appointment.clienteId !== userId) throw new AppError("Ação não autorizada.", 403);

    // Regra de Negócio SaaS: Cancelamento até 2h antes
    const limiteCancelamento = new Date(appointment.dataHora);
    limiteCancelamento.setHours(limiteCancelamento.getHours() - 2);

    if (new Date() > limiteCancelamento) {
      throw new AppError("Cancelamento só é permitido com 2 horas de antecedência.");
    }

    return await prisma.agendamento.update({
      where: { id: appointmentId },
      data: { status: 'CANCELADO' }
    });
  }

  async getTopServices(professionalId: string) {
    // Performance: GroupBy evita N+1
    const top = await prisma.agendamento.groupBy({
      by: ['servicoId'],
      where: { profissionalId, status: 'CONCLUIDO' },
      _count: { servicoId: true },
      orderBy: { _count: { servicoId: 'desc' } },
      take: 3
    });

    // Buscamos os nomes em uma única query
    const serviceIds = top.map(t => t.servicoId);
    const serviceDetails = await prisma.servico.findMany({
      where: { id: { in: serviceIds } }
    });

    return top.map(t => ({
      name: serviceDetails.find(s => s.id === t.servicoId)?.nome,
      count: t._count.servicoId
    }));
  }
}