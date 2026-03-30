import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import { Prisma } from '@prisma/client';

export class FinanceService {
  async generateProfissionalReport(
    profissionalId: string,
    start?: string,
    end?: string
  ) {
    // Tipagem correta (sem any)
    const whereClause: Prisma.AgendamentoWhereInput = {
      profissionalId: profissionalId,
      status: 'CONCLUIDO'
    };

    if (start || end) {
      whereClause.dataHora = {
        ...(start && { gte: new Date(start) }),
        ...(end && { lte: new Date(end) }),
      };
    }

    const appointments = await prisma.agendamento.findMany({
      where: whereClause,
      include: {
        servico: { select: { preco: true } },
        profissional: { select: { nome: true, comissao: true } }
      }
    });

    // Caso não tenha dados
    if (!appointments.length) {
      return {
        faturamentoTotal: 0,
        valorComissao: 0,
        totalAtendimentos: 0
      };
    }

    // Soma total (seguro contra null)
    const faturamentoTotal = appointments.reduce(
      (acc, cur) => acc + (cur.servico?.preco || 0),
      0
    );

    // Pega o primeiro com validação forte
    const [first] = appointments;

    if (!first || !first.profissional) {
      throw new AppError("Erro ao obter dados do profissional");
    }

    const comissaoPercent = first.profissional.comissao;
    const valorComissao = (faturamentoTotal * comissaoPercent) / 100;

    return {
      profissional: first.profissional.nome,
      faturamentoTotal,
      valorComissao,
      totalAtendimentos: appointments.length
    };
  }
}