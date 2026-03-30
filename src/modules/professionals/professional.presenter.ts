interface ProfessionalSummary {
  id: string;
  nome: string;
  comissao: number;
  barbeariaId: string;
}

export const presentProfessional = (professional: ProfessionalSummary) =>
  professional;
