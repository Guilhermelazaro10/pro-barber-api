interface BarbershopSummary {
  id: string;
  nomeFantasia: string;
  slugUrl: string;
  telefone: string | null;
  corPrimaria: string;
  corSecundaria: string;
  logoUrl: string | null;
}

interface ProfessionalSummary {
  id: string;
  nome: string;
}

interface PublicServiceSummary {
  id: string;
  nome: string;
  preco: number;
  duracaoMinutos: number;
}

interface BarbershopPublicView extends BarbershopSummary {
  profissionais: ProfessionalSummary[];
  servicos: PublicServiceSummary[];
}

export const presentBarbershopPublic = (barbershop: BarbershopPublicView) =>
  barbershop;
