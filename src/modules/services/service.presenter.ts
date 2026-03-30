interface ServiceSummary {
  id: string;
  nome: string;
  preco: number;
  duracaoMinutos: number;
  barbeariaId: string;
}

export const presentService = (service: ServiceSummary) => service;
