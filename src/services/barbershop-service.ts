import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';

export class BarbershopService {
  async findBySlug(slug: string) {
    const barbearia = await prisma.barbearia.findFirst({
      where: {
        slugUrl: slug,
        ativo: true,
      },
      select: {
        id: true,
        nomeFantasia: true,
        slugUrl: true,
        telefone: true,
        corPrimaria: true,
        corSecundaria: true,
        logoUrl: true,
        profissionais: {
          select: {
            id: true,
            nome: true,
          },
          orderBy: {
            nome: 'asc',
          },
        },
        servicos: {
          select: {
            id: true,
            nome: true,
            preco: true,
            duracaoMinutos: true,
          },
          orderBy: {
            nome: 'asc',
          },
        },
      },
    });

    if (!barbearia) {
      throw new AppError('Barbearia nao encontrada.', 404);
    }

    return barbearia;
  }
}
