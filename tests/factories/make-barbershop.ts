import { prisma } from '../../src/core/database/prisma.js';
import { makeUniqueValue, trackEntityId } from '../helpers/db.js';

interface MakeBarbershopInput {
  nomeFantasia?: string;
  slugUrl?: string;
  telefone?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  ativo?: boolean;
}

export const makeBarbershop = async (input: MakeBarbershopInput = {}) => {
  const uniqueValue = makeUniqueValue('barbershop');
  const barbershop = await prisma.barbearia.create({
    data: {
      nomeFantasia: input.nomeFantasia ?? `Barbearia ${uniqueValue}`,
      slugUrl: input.slugUrl ?? uniqueValue,
      telefone: input.telefone ?? '85999990000',
      corPrimaria: input.corPrimaria ?? '#111111',
      corSecundaria: input.corSecundaria ?? '#F5F5F5',
      ativo: input.ativo ?? true,
    },
  });

  trackEntityId('barbershops', barbershop.id);

  return barbershop;
};
