import { z } from 'zod';

export const barbershopSlugParamSchema = z.object({
  slug: z.string().min(1, 'O slug da barbearia e obrigatorio.'),
});
