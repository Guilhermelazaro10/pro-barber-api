import type { Request, Response } from 'express';
import { ApiResponse } from '../../core/http/presenters/api-response.js';
import {
  presentAppointment,
  presentAppointmentHistory,
} from './appointment.presenter.js';
import { AppointmentService } from './appointment.service.js';
import {
  appointmentParamSchema,
  availabilityQuerySchema,
  createAppointmentSchema,
} from './appointment.validator.js';

const appointmentService = new AppointmentService();

export class AppointmentController {
  async store(req: Request, res: Response) {
    const input = createAppointmentSchema.parse(req.body);
    const appointment = await appointmentService.create({
      date: input.dataHora,
      user: req.user,
      profissionalId: input.profissionalId,
      servicoId: input.servicoId,
    });

    return res.status(201).json(
      ApiResponse.success(
        presentAppointment(appointment),
        'Agendamento realizado com sucesso.',
        req.requestId
      )
    );
  }

  async index(req: Request, res: Response) {
    const appointments = await appointmentService.findAllByUser(req.user);

    return res.json(
      ApiResponse.success(
        appointments.map(presentAppointmentHistory),
        undefined,
        req.requestId
      )
    );
  }

  async availability(req: Request, res: Response) {
    const query = availabilityQuerySchema.parse(req.query);
    const availableSlots = await appointmentService.getAvailability(
      query.profissionalId,
      query.data,
      query.servicoId
    );

    return res.json(
      ApiResponse.success(availableSlots, undefined, req.requestId)
    );
  }

  async cancel(req: Request, res: Response) {
    const params = appointmentParamSchema.parse(req.params);

    await appointmentService.cancel(params.id, req.user);

    return res.json(
      ApiResponse.success(
        null,
        'Agendamento cancelado com sucesso.',
        req.requestId
      )
    );
  }

  async complete(req: Request, res: Response) {
    const params = appointmentParamSchema.parse(req.params);
    const appointment = await appointmentService.complete(params.id, req.user);

    return res.json(
      ApiResponse.success(
        presentAppointment(appointment),
        'Agendamento concluido com sucesso.',
        req.requestId
      )
    );
  }
}
