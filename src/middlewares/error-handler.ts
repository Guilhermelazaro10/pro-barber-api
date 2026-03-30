import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/app-error.js';
import { ApiResponse } from '../utils/api-response.js';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(ApiResponse.error(err.message));
  }

  if (err instanceof z.ZodError) {
    // Tipagem correta e uso de .issues conforme solicitado
    return res.status(400).json(ApiResponse.error("Erro de validação", err.issues));
  }

  console.error("Critical Error:", err);
  return res.status(500).json(ApiResponse.error("Erro interno do servidor"));
};