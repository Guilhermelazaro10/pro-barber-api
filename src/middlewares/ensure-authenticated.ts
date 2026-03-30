import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/app-error.js';

interface IPayload {
  sub: string;
}

export const ensureAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token não fornecido", 401);
  }

  const [, token] = authHeader.split(" ");

  if (!token) {
    throw new AppError("Token inválido", 401);
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não definido");
  }

  try {
    const decoded = jwt.verify(token, secret) as IPayload;

    req.user = {
      id: decoded.sub,
    };

    return next();
  } catch {
    throw new AppError("Token expirado ou inválido", 401);
  }
};