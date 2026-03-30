import type { Request, Response } from 'express';
import { ApiResponse } from '../../core/http/presenters/api-response.js';
import { presentBarbershopPublic } from './barbershop.presenter.js';
import { BarbershopService } from './barbershop.service.js';
import { barbershopSlugParamSchema } from './barbershop.validator.js';

const barbershopService = new BarbershopService();

export class BarbershopController {
  async show(req: Request, res: Response) {
    const params = barbershopSlugParamSchema.parse(req.params);
    const barbershop = await barbershopService.findBySlug(params.slug);

    return res.json(
      ApiResponse.success(
        presentBarbershopPublic(barbershop),
        undefined,
        req.requestId
      )
    );
  }
}
