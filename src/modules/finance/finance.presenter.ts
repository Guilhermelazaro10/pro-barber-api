interface ProfessionalFinanceReport {
  profissional: string;
  faturamentoTotal: number;
  valorComissao: number;
  totalAtendimentos: number;
}

interface TopService {
  nome: string;
  total: number;
}

export const presentProfessionalFinanceReport = (
  report: ProfessionalFinanceReport
) => report;

export const presentTopServices = (services: TopService[]) => services;
