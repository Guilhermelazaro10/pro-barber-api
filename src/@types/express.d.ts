import 'express';
import type { AuthenticatedUser } from '../types/auth.js';

declare global {
  namespace Express {
    interface Request {
      user: AuthenticatedUser;
    }
  }
}
