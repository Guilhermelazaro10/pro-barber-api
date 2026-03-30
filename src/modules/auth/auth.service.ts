import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { z } from 'zod';
import { env } from '../../core/config/env.js';
import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/app-error.js';
import { loginSchema, registerSchema } from './auth.validator.js';

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

export class AuthService {
  async register(data: RegisterInput) {
    const barbershop = await prisma.barbearia.findFirst({
      where: {
        id: data.barbeariaId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!barbershop) {
      throw new AppError('Barbearia invalida ou inativa.', 404);
    }

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
        barbeariaId: data.barbeariaId,
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
  }

  async login(data: LoginInput) {
    const user = await prisma.cliente.findUnique({
      where: {
        email: data.email,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        senha: true,
        role: true,
        barbeariaId: true,
        barbearia: {
          select: {
            ativo: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('E-mail ou senha invalidos.', 401);
    }

    const passwordMatches = await bcrypt.compare(data.senha, user.senha);

    if (!passwordMatches) {
      throw new AppError('E-mail ou senha invalidos.', 401);
    }

    if (!user.barbearia.ativo) {
      throw new AppError('A barbearia deste usuario esta inativa.', 403);
    }

    const token = jwt.sign({}, env.JWT_SECRET, {
      subject: user.id,
      expiresIn: '7d',
    });

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        role: user.role,
        barbeariaId: user.barbeariaId,
      },
      token,
    };
  }
}
