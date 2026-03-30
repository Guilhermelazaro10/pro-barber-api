import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment-service';
import { ApiResponse } from '../utils/api-response';

const service = new AppointmentService();

export class AppointmentController {
  async store(req: Request, res: Response) {
    const result = await service.create({ ...req.body, userId: req.user.id });
    res.status(201).json(ApiResponse.success(result, "Agendamento criado!"));
  }

  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    await service.cancel(id, req.user.id);
    res.json(ApiResponse.success(null, "Agendamento cancelado."));
  }

  async top(req: Request, res: Response) {
    const { id } = req.params;
    const data = await service.getTopServices(id);
    res.json(ApiResponse.success(data));
  }
}