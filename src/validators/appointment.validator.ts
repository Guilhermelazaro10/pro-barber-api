import { z } from 'zod';

export const createAppointmentSchema = z.object({
  dataHora: z.string().datetime("Formato de data ISO inválido"),
  barbeariaId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  servicoId: z.string().uuid()
});