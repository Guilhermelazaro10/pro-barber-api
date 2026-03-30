import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

type RegisterData = z.infer<typeof registerSchema>;
type LoginData = z.infer<typeof loginSchema>;

export class AuthService {
  async executeRegister(data: RegisterData) {
    const barbearia = await prisma.barbearia.findFirst({
      where: {
        id: data.barbeariaId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!barbearia) {
      throw new AppError('Barbearia invalida ou inativa.', 404);
    }

    const userExists = await prisma.cliente.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new AppError('Este e-mail ja esta em uso por outro usuario.', 400);
    }

    const senhaHash = await bcrypt.hash(data.senha, 10);

    return prisma.cliente.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: senhaHash,
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

  async executeLogin({ email, senha }: LoginData) {
    const user = await prisma.cliente.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        role: true,
        barbeariaId: true,
      },
    });

    if (!user) {
      throw new AppError('E-mail ou senha invalidos.', 401);
    }

    const passwordMatch = await bcrypt.compare(senha, user.senha);

    if (!passwordMatch) {
      throw new AppError('E-mail ou senha invalidos.', 401);
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
        role: user.role,
        barbeariaId: user.barbeariaId,
      },
      token,
    };
  }
}
