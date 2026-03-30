import { AppointmentStatus, type Prisma } from '@prisma/client';
import { parseISO } from 'date-fns';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';

const parseOptionalIsoDate = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = parseISO(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Filtro de data invalido.', 400);
  }

  return parsed;
};

export class FinanceService {
  async generateProfissionalReport(
    profissionalId: string,
    barbeariaId: string,
    start?: string,
    end?: string
  ) {
    const profissional = await prisma.profissional.findFirst({
      where: {
        id: profissionalId,
        barbeariaId,
      },
      select: {
        id: true,
        nome: true,
        comissao: true,
      },
    });

    if (!profissional) {
      throw new AppError('Profissional nao encontrado para a sua barbearia.', 404);
    }

    const startDate = parseOptionalIsoDate(start);
    const endDate = parseOptionalIsoDate(end);

    const whereClause: Prisma.AgendamentoWhereInput = {
      profissionalId,
      barbeariaId,
      status: AppointmentStatus.CONCLUIDO,
    };

    if (startDate || endDate) {
      whereClause.dataHora = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const appointments = await prisma.agendamento.findMany({
      where: whereClause,
      select: {
        precoCobrado: true,
      },
    });

    const faturamentoTotal = appointments.reduce(
      (acc, cur) => acc + cur.precoCobrado,
      0
    );
    const valorComissao = (faturamentoTotal * profissional.comissao) / 100;

    return {
      profissional: profissional.nome,
      faturamentoTotal,
      valorComissao,
      totalAtendimentos: appointments.length,
    };
  }

  async getTopServices(profissionalId: string, barbeariaId: string) {
    const profissional = await prisma.profissional.findFirst({
      where: {
        id: profissionalId,
        barbeariaId,
      },
      select: {
        id: true,
      },
    });

    if (!profissional) {
      throw new AppError('Profissional nao encontrado para a sua barbearia.', 404);
    }

    const top = await prisma.agendamento.groupBy({
      by: ['servicoId'],
      where: {
        profissionalId,
        barbeariaId,
        status: AppointmentStatus.CONCLUIDO,
      },
      _count: { servicoId: true },
      orderBy: { _count: { servicoId: 'desc' } },
      take: 3,
    });

    const serviceIds = top.map((item) => item.servicoId);
    const services = await prisma.servico.findMany({
      where: {
        id: { in: serviceIds },
        barbeariaId,
      },
      select: {
        id: true,
        nome: true,
      },
    });

    return top.map((item) => ({
      nome: services.find((service) => service.id === item.servicoId)?.nome ??
        'Servico removido',
      total: item._count.servicoId,
    }));
  }
}
