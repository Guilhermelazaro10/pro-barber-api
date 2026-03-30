import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

// Inferindo os tipos das validações para evitar o uso de 'any'
type RegisterData = z.infer<typeof registerSchema>;
type LoginData = z.infer<typeof loginSchema>;

const JWT_SECRET = process.env.JWT_SECRET;

export class AuthService {
  /**
   * Registra um novo cliente com criptografia de senha
   */
  async executeRegister(data: RegisterData) {
    // Verificação de duplicidade
    const userExists = await prisma.cliente.findUnique({ 
      where: { email: data.email } 
    });

    if (userExists) {
      throw new AppError("Este e-mail já está em uso por outro usuário.", 400);
    }

    // Criptografia (Security hashing)
    const senhaHash = await bcrypt.hash(data.senha, 10);

    const user = await prisma.cliente.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: senhaHash,
        telefone: data.telefone,
        barbeariaId: data.barbeariaId,
      },
      select: { 
        id: true, 
        nome: true, 
        email: true,
        telefone: true
      }
    });

    return user;
  }

  /**
   * Autentica o usuário e gera um token JWT de longa duração
   */
  async executeLogin({ email, senha }: LoginData) {
    if (!JWT_SECRET) {
      throw new AppError("Erro interno: Chave de segurança não configurada.", 500);
    }

    // Busca o usuário incluindo a senha para comparação
    const user = await prisma.cliente.findUnique({ 
      where: { email } 
    });
    
    if (!user) {
      throw new AppError("E-mail ou senha inválidos.", 401);
    }

    // Validação da senha criptografada
    const passwordMatch = await bcrypt.compare(senha, user.senha);
    
    if (!passwordMatch) {
      throw new AppError("E-mail ou senha inválidos.", 401);
    }

    // Geração do Token JWT (Padrão: sub = ID do usuário)
    const token = jwt.sign({}, JWT_SECRET, {
      subject: user.id,
      expiresIn: '7d'
    });

    return {
      user: { 
        id: user.id, 
        nome: user.nome, 
        email: user.email 
      },
      token
    };
  }
}