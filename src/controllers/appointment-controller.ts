import type { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment-service.js';
import { ApiResponse } from '../utils/api-response.js';
import { createAppointmentSchema } from '../validators/appointment.validator.js';

const service = new AppointmentService();

export class AppointmentController {
  /**
   * POST /agendamentos
   * Cria um novo agendamento validando os dados com Zod
   */
  async store(req: Request, res: Response) {
    // 1. Validação de Schema (Garante que req.body está no formato certo)
    // O errorHandler global capturará erros do Zod automaticamente
    const validatedData = createAppointmentSchema.parse(req.body);

    // 2. Chamada ao Service com mapeamento explícito
    const result = await service.create({ 
      date: validatedData.dataHora, 
      userId: req.user.id,
      barbeariaId: validatedData.barbeariaId,
      profissionalId: validatedData.profissionalId,
      servicoId: validatedData.servicoId
    });

    return res.status(201).json(
      ApiResponse.success(result, "Agendamento realizado com sucesso!")
    );
  }

  /**
   * GET /agendamentos/meus
   * Lista o histórico de agendamentos do cliente logado
   */
  async index(req: Request, res: Response) {
    // req.user.id vem do middleware de autenticação tipado no @types
    const result = await service.findAllByUser(req.user.id);
    
    return res.json(ApiResponse.success(result));
  }

  /**
   * GET /agendamentos/disponibilidade
   * Retorna os horários disponíveis de um profissional em uma data
   */
  async availability(req: Request, res: Response) {
    // Tipagem explícita para evitar erros de query params
    const profissionalId = req.query.profissionalId as string;
    const data = req.query.data as string;

    if (!profissionalId || !data) {
      return res.status(400).json(
        ApiResponse.error("Parâmetros 'profissionalId' e 'data' são obrigatórios.")
      );
    }

    const availableSlots = await service.getAvailability(profissionalId, data);

    return res.json(ApiResponse.success(availableSlots));
  }

  /**
   * PATCH /agendamentos/:id/cancelar
   * Cancela um agendamento (Valida dono e antecedência de 2h)
   */
  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    
    await service.cancel(id, req.user.id);
    
    return res.json(ApiResponse.success(null, "Agendamento cancelado com sucesso."));
  }

  /**
   * GET /agendamentos/top-servicos/:id
   * Retorna o ranking de serviços do profissional
   */
  async top(req: Request, res: Response) {
    const { id } = req.params;
    
    const data = await service.getTopServices(id);
    
    return res.json(ApiResponse.success(data));
  }
}