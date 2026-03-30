import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/app-error.js';
import type { AuthenticatedUser } from '../../core/types/authenticated-user.js';
import { decimalToNumber } from '../../core/utils/decimal.js';

export class ProfessionalService {
  async listByBarbershop(user: AuthenticatedUser) {
    const professionals = await prisma.profissional.findMany({
      where: {
        barbeariaId: user.barbeariaId,
      },
      select: {
        id: true,
        nome: true,
        comissao: true,
        barbeariaId: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return professionals.map((professional) => ({
      ...professional,
      comissao: decimalToNumber(professional.comissao),
    }));
  }

  async findById(user: AuthenticatedUser, id: string) {
    const professional = await prisma.profissional.findFirst({
      where: {
        id,
        barbeariaId: user.barbeariaId,
      },
      select: {
        id: true,
        nome: true,
        comissao: true,
        barbeariaId: true,
      },
    });

    if (!professional) {
      throw new AppError('Profissional nao encontrado para a sua barbearia.', 404);
    }

    return {
      ...professional,
      comissao: decimalToNumber(professional.comissao),
    };
  }
}
