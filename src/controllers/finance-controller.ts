import type { Request, Response } from 'express';
import { FinanceService } from '../services/finance-service.js';
import { ApiResponse } from '../utils/api-response.js';
import {
  financeQuerySchema,
  profissionalParamSchema,
} from '../validators/finance.validator.js';

const financeService = new FinanceService();

export class FinanceController {
  async getReport(req: Request, res: Response) {
    const { id } = profissionalParamSchema.parse(req.params);
    const { inicio, fim } = financeQuerySchema.parse(req.query);

    const report = await financeService.generateProfissionalReport(
      id,
      req.user.barbeariaId,
      inicio,
      fim
    );

    return res.json(ApiResponse.success(report));
  }

  async getTopServices(req: Request, res: Response) {
    const { id } = profissionalParamSchema.parse(req.params);
    const data = await financeService.getTopServices(id, req.user.barbeariaId);

    return res.json(ApiResponse.success(data));
  }
}
