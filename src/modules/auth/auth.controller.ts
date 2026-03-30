import type { Request, Response } from 'express';
import { ApiResponse } from '../../core/http/presenters/api-response.js';
import { presentAuthSession, presentUserSummary } from './auth.presenter.js';
import { AuthService } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.validator.js';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body);
    const user = await authService.register(input);

    return res.status(201).json(
      ApiResponse.success(
        presentUserSummary(user),
        'Usuario criado com sucesso.',
        req.requestId
      )
    );
  }

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const session = await authService.login(input);

    return res.json(
      ApiResponse.success(
        presentAuthSession(session),
        undefined,
        req.requestId
      )
    );
  }
}
