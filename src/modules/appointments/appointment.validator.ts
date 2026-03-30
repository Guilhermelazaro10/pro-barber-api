import { z } from 'zod';

export const createAppointmentSchema = z.object({
  dataHora: z.string().datetime({
    offset: true,
    message: 'Formato de data ISO invalido.',
  }),
  profissionalId: z.string().uuid('ID do profissional invalido.'),
  servicoId: z.string().uuid('ID do servico invalido.'),
});

export const availabilityQuerySchema = z.object({
  profissionalId: z.string().uuid('ID do profissional invalido.'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD.'),
  servicoId: z.string().uuid('ID do servico invalido.').optional(),
});

export const appointmentParamSchema = z.object({
  id: z.string().uuid('ID do agendamento invalido.'),
});
