import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/api-response.js';
import { BarbershopService } from '../services/barbershop-service.js';

const barbershopService = new BarbershopService();

export class BarbershopController {
  async show(req: Request, res: Response) {
    const { slug } = req.params;

    if (!slug) {
      return res
        .status(400)
        .json(ApiResponse.error('O slug da barbearia e obrigatorio.'));
    }

    const data = await barbershopService.findBySlug(slug);

    return res.json(ApiResponse.success(data));
  }
}
