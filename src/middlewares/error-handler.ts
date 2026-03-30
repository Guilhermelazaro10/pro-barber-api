import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { z } from 'zod';
import { ApiResponse } from '../utils/api-response';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(ApiResponse.error(err.message));
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json(ApiResponse.error("Erro de validação", err.issues));
  }

  console.error(err);
  return res.status(500).json(ApiResponse.error("Erro interno do servidor"));
};