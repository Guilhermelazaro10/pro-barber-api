import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/app-error.js';

interface IPayload {
  sub: string;
}

export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) throw new AppError("Token não fornecido", 401);

  const [, token] = authHeader.split(" ");

  try {
    const { sub: userId } = jwt.verify(token, process.env.JWT_SECRET!) as IPayload;
    
    // req.user.id agora funciona por causa da extensão no @types
    req.user = { id: userId };
    
    return next();
  } catch {
    throw new AppError("Token expirado ou inválido", 401);
  }
};