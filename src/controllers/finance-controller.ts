import type { Request, Response } from 'express';
import { FinanceService } from '../services/finance-service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

const financeService = new FinanceService();

export class FinanceController {
  async getReport(req: Request, res: Response) {
    const id = req.params.id;
    const inicio =
      typeof req.query.inicio === 'string' ? req.query.inicio : undefined;
    const fim =
      typeof req.query.fim === 'string' ? req.query.fim : undefined;

    if (!id) {
      throw new AppError('ID do profissional é obrigatório', 400);
    }

    const report = await financeService.generateProfissionalReport(
      id,
      inicio,
      fim
    );

    return res.json(ApiResponse.success(report));
  }
}