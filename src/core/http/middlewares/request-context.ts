import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const requestContext = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const incomingRequestId = req.header('x-request-id');
  const requestId =
    typeof incomingRequestId === 'string' && incomingRequestId.trim().length > 0
      ? incomingRequestId.trim()
      : randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    console.log(
      JSON.stringify({
        level: 'info',
        requestId,
        method: req.method,
        route: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        userId: req.user?.id,
        barbeariaId: req.user?.barbeariaId,
      })
    );
  });

  return next();
};
