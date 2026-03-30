import type { Request, Response } from 'express';
import { ApiResponse } from '../../core/http/presenters/api-response.js';
import { presentProfessional } from './professional.presenter.js';
import { ProfessionalService } from './professional.service.js';
import { professionalParamSchema } from './professional.validator.js';

const professionalService = new ProfessionalService();

export class ProfessionalController {
  async index(req: Request, res: Response) {
    const professionals = await professionalService.listByBarbershop(req.user);

    return res.json(
      ApiResponse.success(
        professionals.map(presentProfessional),
        undefined,
        req.requestId
      )
    );
  }

  async show(req: Request, res: Response) {
    const params = professionalParamSchema.parse(req.params);
    const professional = await professionalService.findById(req.user, params.id);

    return res.json(
      ApiResponse.success(
        presentProfessional(professional),
        undefined,
        req.requestId
      )
    );
  }
}
