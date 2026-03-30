import type { UserRole } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../errors/app-error.js';

export const ensureRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Voce nao tem permissao para acessar este recurso.', 403);
    }

    return next();
  };
};
