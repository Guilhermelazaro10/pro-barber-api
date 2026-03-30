import bcrypt from 'bcryptjs';
import type { z } from 'zod';
import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/app-error.js';
import type { AuthenticatedUser } from '../../core/types/authenticated-user.js';
import { createAdminSchema } from './user.validator.js';

type CreateAdminInput = z.infer<typeof createAdminSchema>;

export class UserService {
  async getProfile(user: AuthenticatedUser) {
    const profile = await prisma.cliente.findFirst({
      where: {
        id: user.id,
        barbeariaId: user.barbeariaId,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        role: true,
        barbeariaId: true,
        criadoEm: true,
      },
    });

    if (!profile) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    return profile;
  }

  async listByBarbershop(user: AuthenticatedUser) {
    return prisma.cliente.findMany({
      where: {
        barbeariaId: user.barbeariaId,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        role: true,
        barbeariaId: true,
        criadoEm: true,
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });
  }

  async createAdmin(user: AuthenticatedUser, data: CreateAdminInput) {
    const existingUser = await prisma.cliente.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      throw new AppError('Este e-mail ja esta em uso por outro usuario.', 400);
    }

    const passwordHash = await bcrypt.hash(data.senha, 10);

    return prisma.cliente.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: passwordHash,
        telefone: data.telefone,
        barbeariaId: user.barbeariaId,
        role: 'ADMIN',
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        role: true,
        barbeariaId: true,
        criadoEm: true,
      },
    });
  }
}
