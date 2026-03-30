import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';

const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return helmetMiddleware(req, res, next);
};
