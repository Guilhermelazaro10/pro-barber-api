import type { Request, Response } from 'express';
import { AuthService } from '../services/auth-service.js';
import { ApiResponse } from '../utils/api-response.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const data = registerSchema.parse(req.body);
    const user = await authService.executeRegister(data);

    return res.status(201).json(ApiResponse.success(user, 'Usuario criado com sucesso.'));
  }

  async login(req: Request, res: Response) {
    const data = loginSchema.parse(req.body);
    const session = await authService.executeLogin(data);

    return res.json(ApiResponse.success(session));
  }
}
