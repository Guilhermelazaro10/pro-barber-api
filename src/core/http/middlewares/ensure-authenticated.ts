import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../database/prisma.js';
import { AppError } from '../../errors/app-error.js';

export const ensureAuthenticated = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token nao fornecido.', 401);
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Token invalido.', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === 'string' || !decoded.sub) {
      throw new AppError('Token invalido.', 401);
    }

    const user = await prisma.cliente.findUnique({
      where: {
        id: decoded.sub,
      },
      select: {
        id: true,
        barbeariaId: true,
        role: true,
        barbearia: {
          select: {
            ativo: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Usuario autenticado nao encontrado.', 401);
    }

    if (!user.barbearia.ativo) {
      throw new AppError('A barbearia deste usuario esta inativa.', 403);
    }

    req.user = {
      id: user.id,
      barbeariaId: user.barbeariaId,
      role: user.role,
    };

    return next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Token expirado ou invalido.', 401);
  }
};
