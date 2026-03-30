import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../../src/core/database/prisma.js';
import { makeUniqueValue, trackEntityId } from '../helpers/db.js';

interface MakeUserInput {
  barbeariaId: string;
  nome?: string;
  email?: string;
  telefone?: string;
  senha?: string;
  role?: UserRole;
}

export const makeUser = async (input: MakeUserInput) => {
  const plainPassword = input.senha ?? '123456';
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const user = await prisma.cliente.create({
    data: {
      nome: input.nome ?? `Usuario ${makeUniqueValue('user')}`,
      email: input.email ?? `${makeUniqueValue('user')}@teste.com`,
      telefone: input.telefone ?? '85988888888',
      senha: passwordHash,
      role: input.role ?? UserRole.CLIENTE,
      barbeariaId: input.barbeariaId,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      role: true,
      barbeariaId: true,
    },
  });

  trackEntityId('users', user.id);

  return {
    ...user,
    plainPassword,
  };
};
