import { prisma } from '../../src/core/database/prisma.js';
import { makeUniqueValue, trackEntityId } from '../helpers/db.js';

interface MakeServiceInput {
  barbeariaId: string;
  nome?: string;
  preco?: number;
  duracaoMinutos?: number;
}

export const makeService = async (input: MakeServiceInput) => {
  const service = await prisma.servico.create({
    data: {
      nome: input.nome ?? `Servico ${makeUniqueValue('service')}`,
      preco: input.preco ?? 45,
      duracaoMinutos: input.duracaoMinutos ?? 30,
      barbeariaId: input.barbeariaId,
    },
  });

  trackEntityId('services', service.id);

  return service;
};
