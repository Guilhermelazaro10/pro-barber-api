import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/app-error.js';
import { ApiResponse } from '../presenters/api-response.js';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(ApiResponse.error(err.message, err.details, req.requestId));
  }

  if (err instanceof z.ZodError) {
    return res
      .status(400)
      .json(ApiResponse.error('Erro de validacao.', err.issues, req.requestId));
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res
        .status(409)
        .json(
          ApiResponse.error(
            'Ja existe um registro com esse valor unico.',
            err.meta,
            req.requestId
          )
        );
    }

    if (err.code === 'P2003') {
      return res
        .status(400)
        .json(
          ApiResponse.error(
            'Relacionamento invalido para este registro.',
            err.meta,
            req.requestId
          )
        );
    }

    if (err.code === 'P2025') {
      return res
        .status(404)
        .json(ApiResponse.error('Registro nao encontrado.', err.meta, req.requestId));
    }
  }

  console.error(
    JSON.stringify({
      level: 'error',
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  );

  return res
    .status(500)
    .json(ApiResponse.error('Erro interno do servidor.', undefined, req.requestId));
};
