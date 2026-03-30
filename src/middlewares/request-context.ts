import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const requestContext = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const headerRequestId = req.header('x-request-id');
  const requestId =
    typeof headerRequestId === 'string' && headerRequestId.trim().length > 0
      ? headerRequestId.trim()
      : randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    if (req.path === '/health') {
      return;
    }

    console.log(
      JSON.stringify({
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
      })
    );
  });

  return next();
};
