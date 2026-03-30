import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';

interface JwtPayload {
  sub?: string;
}

export const ensureAuthenticated = async (
  req: Request,
  res: Response,
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
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (!decoded.sub) {
      throw new AppError('Token invalido.', 401);
    }

    const user = await prisma.cliente.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        barbeariaId: true,
        role: true,
      },
    });

    if (!user) {
      throw new AppError('Usuario autenticado nao encontrado.', 401);
    }

    req.user = user;

    return next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Token expirado ou invalido.', 401);
  }
};
