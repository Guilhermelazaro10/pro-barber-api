import type { Request, Response } from 'express';
import { ApiResponse } from '../../core/http/presenters/api-response.js';
import { presentUserProfile, presentUserSummary } from '../auth/auth.presenter.js';
import { UserService } from './user.service.js';
import { createAdminSchema } from './user.validator.js';

const userService = new UserService();

export class UserController {
  async me(req: Request, res: Response) {
    const profile = await userService.getProfile(req.user);

    return res.json(
      ApiResponse.success(
        presentUserProfile(profile),
        undefined,
        req.requestId
      )
    );
  }

  async index(req: Request, res: Response) {
    const users = await userService.listByBarbershop(req.user);

    return res.json(
      ApiResponse.success(
        users.map(presentUserProfile),
        undefined,
        req.requestId
      )
    );
  }

  async createAdmin(req: Request, res: Response) {
    const input = createAdminSchema.parse(req.body);
    const user = await userService.createAdmin(req.user, input);

    return res.status(201).json(
      ApiResponse.success(
        presentUserSummary(user),
        'Admin criado com sucesso.',
        req.requestId
      )
    );
  }
}
