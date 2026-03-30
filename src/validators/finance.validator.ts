import { z } from 'zod';

const isoDateFilterSchema = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'Formato de data invalido.',
  })
  .optional();

export const profissionalParamSchema = z.object({
  id: z.string().uuid('ID do profissional invalido.'),
});

export const financeQuerySchema = z.object({
  inicio: isoDateFilterSchema,
  fim: isoDateFilterSchema,
});
