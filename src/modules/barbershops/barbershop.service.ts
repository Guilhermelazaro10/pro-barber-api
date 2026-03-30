import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/app-error.js';
import { decimalToNumber } from '../../core/utils/decimal.js';

export class BarbershopService {
  async findBySlug(slug: string) {
    const barbershop = await prisma.barbearia.findFirst({
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

    if (!barbershop) {
      throw new AppError('Barbearia nao encontrada.', 404);
    }

    return {
      ...barbershop,
      servicos: barbershop.servicos.map((service) => ({
        ...service,
        preco: decimalToNumber(service.preco),
      })),
    };
  }
}
