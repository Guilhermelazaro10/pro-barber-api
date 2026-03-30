import type { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment-service.js';
import { ApiResponse } from '../utils/api-response.js';
import {
  appointmentParamSchema,
  availabilityQuerySchema,
  createAppointmentSchema,
} from '../validators/appointment.validator.js';

const service = new AppointmentService();

export class AppointmentController {
  async store(req: Request, res: Response) {
    const validatedData = createAppointmentSchema.parse(req.body);

    const result = await service.create({
      date: validatedData.dataHora,
      user: req.user,
      profissionalId: validatedData.profissionalId,
      servicoId: validatedData.servicoId,
    });

    return res
      .status(201)
      .json(ApiResponse.success(result, 'Agendamento realizado com sucesso.'));
  }

  async index(req: Request, res: Response) {
    const result = await service.findAllByUser(req.user);

    return res.json(ApiResponse.success(result));
  }

  async availability(req: Request, res: Response) {
    const query = availabilityQuerySchema.parse(req.query);

    const availableSlots = await service.getAvailability(
      query.profissionalId,
      query.data,
      query.servicoId
    );

    return res.json(ApiResponse.success(availableSlots));
  }

  async cancel(req: Request, res: Response) {
    const { id } = appointmentParamSchema.parse(req.params);

    await service.cancel(id, req.user);

    return res.json(ApiResponse.success(null, 'Agendamento cancelado com sucesso.'));
  }

  async complete(req: Request, res: Response) {
    const { id } = appointmentParamSchema.parse(req.params);

    const result = await service.complete(id, req.user);

    return res.json(ApiResponse.success(result, 'Agendamento concluido com sucesso.'));
  }
}
