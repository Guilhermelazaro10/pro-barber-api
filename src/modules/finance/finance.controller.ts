import type { Request, Response } from 'express';
import { ApiResponse } from '../../core/http/presenters/api-response.js';
import {
  presentProfessionalFinanceReport,
  presentTopServices,
} from './finance.presenter.js';
import { FinanceService } from './finance.service.js';
import {
  financeProfessionalParamSchema,
  financeQuerySchema,
} from './finance.validator.js';

const financeService = new FinanceService();

export class FinanceController {
  async getReport(req: Request, res: Response) {
    const params = financeProfessionalParamSchema.parse(req.params);
    const query = financeQuerySchema.parse(req.query);

    const report = await financeService.generateProfessionalReport(
      params.id,
      req.user.barbeariaId,
      query.inicio,
      query.fim
    );

    return res.json(
      ApiResponse.success(
        presentProfessionalFinanceReport(report),
        undefined,
        req.requestId
      )
    );
  }

  async getTopServices(req: Request, res: Response) {
    const params = financeProfessionalParamSchema.parse(req.params);
    const topServices = await financeService.getTopServices(
      params.id,
      req.user.barbeariaId
    );

    return res.json(
      ApiResponse.success(
        presentTopServices(topServices),
        undefined,
        req.requestId
      )
    );
  }
}
