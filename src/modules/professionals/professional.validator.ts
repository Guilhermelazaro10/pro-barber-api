import { z } from 'zod';

export const professionalParamSchema = z.object({
  id: z.string().uuid('ID do profissional invalido.'),
});
