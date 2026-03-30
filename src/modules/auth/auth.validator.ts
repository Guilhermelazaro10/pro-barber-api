import { z } from 'zod';

export const registerSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Formato de e-mail invalido.'),
  senha: z.string().min(6, 'A senha deve ter no minimo 6 caracteres.'),
  telefone: z.string().min(10, 'Telefone invalido.'),
  barbeariaId: z.string().uuid('ID da barbearia invalido.'),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail invalido.'),
  senha: z.string().min(1, 'A senha e obrigatoria.'),
});
