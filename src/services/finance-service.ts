import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';

export class FinanceService {
  async generateProfessionalReport(professionalId: string, start?: string, end?: string) {
    const whereClause: any = { 
      profissionalId: professionalId, 
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

    if (!appointments.length) {
      return { faturamentoTotal: 0, valorComissao: 0, totalAtendimentos: 0 };
    }

    const faturamentoTotal = appointments.reduce((acc, cur) => acc + (cur.servico?.preco || 0), 0);
    const comissaoPercent = appointments[0].profissional.comissao;
    const valorComissao = (faturamentoTotal * comissaoPercent) / 100;

    return {
      profissional: appointments[0].profissional.nome,
      faturamentoTotal,
      valorComissao,
      totalAtendimentos: appointments.length
    };
  }
}