import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/app-error.js';
import type { AuthenticatedUser } from '../../core/types/authenticated-user.js';
import { decimalToNumber } from '../../core/utils/decimal.js';

export class ServiceService {
  async listByBarbershop(user: AuthenticatedUser) {
    const services = await prisma.servico.findMany({
      where: {
        barbeariaId: user.barbeariaId,
      },
      select: {
        id: true,
        nome: true,
        preco: true,
        duracaoMinutos: true,
        barbeariaId: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return services.map((service) => ({
      ...service,
      preco: decimalToNumber(service.preco),
    }));
  }

  async findById(user: AuthenticatedUser, id: string) {
    const service = await prisma.servico.findFirst({
      where: {
        id,
        barbeariaId: user.barbeariaId,
      },
      select: {
        id: true,
        nome: true,
        preco: true,
        duracaoMinutos: true,
        barbeariaId: true,
      },
    });

    if (!service) {
      throw new AppError('Servico nao encontrado para a sua barbearia.', 404);
    }

    return {
      ...service,
      preco: decimalToNumber(service.preco),
    };
  }
}
