import 'express';
import type { AuthenticatedUser } from './authenticated-user.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user: AuthenticatedUser;
    }
  }
}
