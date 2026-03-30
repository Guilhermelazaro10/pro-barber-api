import type { Request, Response } from 'express';
import { ApiResponse } from '../../core/http/presenters/api-response.js';
import { presentService } from './service.presenter.js';
import { ServiceService } from './service.service.js';
import { serviceParamSchema } from './service.validator.js';

const serviceService = new ServiceService();

export class ServiceController {
  async index(req: Request, res: Response) {
    const services = await serviceService.listByBarbershop(req.user);

    return res.json(
      ApiResponse.success(
        services.map(presentService),
        undefined,
        req.requestId
      )
    );
  }

  async show(req: Request, res: Response) {
    const params = serviceParamSchema.parse(req.params);
    const service = await serviceService.findById(req.user, params.id);

    return res.json(
      ApiResponse.success(
        presentService(service),
        undefined,
        req.requestId
      )
    );
  }
}
