import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-probarber-ufc';

export class AuthService {
  async executeRegister(data: any) {
    const userExists = await prisma.cliente.findUnique({ where: { email: data.email } });
    if (userExists) throw new AppError("E-mail já cadastrado", 400);

    const senhaHash = await bcrypt.hash(data.senha, 10);

    const user = await prisma.cliente.create({
      data: { ...data, senha: senhaHash },
      select: { id: true, nome: true, email: true } // Nunca retorne a senha
    });

    return user;
  }

  async executeLogin({ email, senha }: any) {
    const user = await prisma.cliente.findUnique({ where: { email } });
    
    if (!user) throw new AppError("E-mail ou senha inválidos", 401);

    const passwordMatch = await bcrypt.compare(senha, user.senha);
    if (!passwordMatch) throw new AppError("E-mail ou senha inválidos", 401);

    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      subject: user.id,
      expiresIn: '7d'
    });

    return {
      user: { id: user.id, nome: user.nome, email: user.email },
      token
    };
  }
}