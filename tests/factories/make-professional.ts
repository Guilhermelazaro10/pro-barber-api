import { prisma } from '../../src/core/database/prisma.js';
import { makeUniqueValue, trackEntityId } from '../helpers/db.js';

interface MakeProfessionalInput {
  barbeariaId: string;
  nome?: string;
  comissao?: number;
}

export const makeProfessional = async (input: MakeProfessionalInput) => {
  const professional = await prisma.profissional.create({
    data: {
      nome: input.nome ?? `Profissional ${makeUniqueValue('professional')}`,
      comissao: input.comissao ?? 50,
      barbeariaId: input.barbeariaId,
    },
  });

  trackEntityId('professionals', professional.id);

  return professional;
};
