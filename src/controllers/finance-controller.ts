import { Request, Response } from 'express';
import { FinanceService } from '../services/finance-service.js';
import { ApiResponse } from '../utils/api-response.js';

const financeService = new FinanceService();

export class FinanceController {
  async getReport(req: Request, res: Response) {
    const { id } = req.params;
    const { inicio, fim } = req.query;

    const report = await financeService.generateProfessionalReport(
      id, 
      inicio as string, 
      fim as string
    );
    
    return res.json(ApiResponse.success(report));
  }
}