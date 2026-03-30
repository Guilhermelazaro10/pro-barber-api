import { AppointmentStatus, type Prisma } from '@prisma/client';
import { parseISO } from 'date-fns';
import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/app-error.js';
import { decimalToNumber, roundCurrency } from '../../core/utils/decimal.js';

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
  async generateProfessionalReport(
    profissionalId: string,
    barbeariaId: string,
    start?: string,
    end?: string
  ) {
    const professional = await prisma.profissional.findFirst({
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

    if (!professional) {
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
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };
    }

    const appointments = await prisma.agendamento.findMany({
      where: whereClause,
      select: {
        precoCobrado: true,
      },
    });

    const faturamentoTotal = roundCurrency(
      appointments.reduce(
        (accumulator, appointment) =>
          accumulator + decimalToNumber(appointment.precoCobrado),
        0
      )
    );
    const valorComissao = roundCurrency(
      (faturamentoTotal * decimalToNumber(professional.comissao)) / 100
    );

    return {
      profissional: professional.nome,
      faturamentoTotal,
      valorComissao,
      totalAtendimentos: appointments.length,
    };
  }

  async getTopServices(profissionalId: string, barbeariaId: string) {
    const professional = await prisma.profissional.findFirst({
      where: {
        id: profissionalId,
        barbeariaId,
      },
      select: {
        id: true,
      },
    });

    if (!professional) {
      throw new AppError('Profissional nao encontrado para a sua barbearia.', 404);
    }

    const topServices = await prisma.agendamento.groupBy({
      by: ['servicoId'],
      where: {
        profissionalId,
        barbeariaId,
        status: AppointmentStatus.CONCLUIDO,
      },
      _count: {
        servicoId: true,
      },
      orderBy: {
        _count: {
          servicoId: 'desc',
        },
      },
      take: 3,
    });

    const serviceIds = topServices.map((item) => item.servicoId);
    const services = await prisma.servico.findMany({
      where: {
        id: {
          in: serviceIds,
        },
        barbeariaId,
      },
      select: {
        id: true,
        nome: true,
      },
    });

    return topServices.map((item) => ({
      nome:
        services.find((service) => service.id === item.servicoId)?.nome ??
        'Servico removido',
      total: item._count.servicoId,
    }));
  }
}
