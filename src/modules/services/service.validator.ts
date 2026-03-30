import { z } from 'zod';

export const serviceParamSchema = z.object({
  id: z.string().uuid('ID do servico invalido.'),
});
