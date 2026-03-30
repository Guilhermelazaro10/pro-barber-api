import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../utils/app-error.js';
import { ApiResponse } from '../utils/api-response.js';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(ApiResponse.error(err.message));
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json(ApiResponse.error('Erro de validacao.', err.issues));
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res
        .status(409)
        .json(ApiResponse.error('Ja existe um registro com esse valor unico.'));
    }

    if (err.code === 'P2003') {
      return res
        .status(400)
        .json(ApiResponse.error('Relacionamento invalido para este registro.'));
    }
  }

  console.error('Critical Error:', {
    requestId: req.requestId,
    error: err,
  });
  return res.status(500).json(ApiResponse.error('Erro interno do servidor.'));
};
