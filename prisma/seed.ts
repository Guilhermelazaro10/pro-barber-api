import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function findOrCreateServico(barbeariaId: string, nome: string, preco: number, duracaoMinutos: number) {
  const existing = await prisma.servico.findFirst({
    where: {
      barbeariaId,
      nome,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.servico.create({
    data: {
      nome,
      preco,
      duracaoMinutos,
      barbeariaId,
    },
  });
}

async function findOrCreateProfissional(barbeariaId: string, nome: string, comissao: number) {
  const existing = await prisma.profissional.findFirst({
    where: {
      barbeariaId,
      nome,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.profissional.create({
    data: {
      nome,
      comissao,
      barbeariaId,
    },
  });
}

async function main() {
  console.log('Iniciando o seed de dados...');

  const barbearia = await prisma.barbearia.upsert({
    where: { slugUrl: 'probarber-matriz' },
    update: {},
    create: {
      nomeFantasia: 'ProBarber Matriz - UFC',
      slugUrl: 'probarber-matriz',
      telefone: '85999999999',
      corPrimaria: '#1A1A1B',
      corSecundaria: '#D4AF37',
    },
  });

  await Promise.all([
    findOrCreateServico(barbearia.id, 'Corte de Cabelo Moderno', 45, 30),
    findOrCreateServico(barbearia.id, 'Barba Completa (Toalha Quente)', 35, 30),
    findOrCreateProfissional(barbearia.id, 'Mestre Cabeludo', 50),
    findOrCreateProfissional(barbearia.id, 'Barbeiro Novato', 30),
  ]);

  const senhaHash = await bcrypt.hash('123456', 10);

  await prisma.cliente.upsert({
    where: { email: 'cliente@teste.com' },
    update: {
      nome: 'Guilherme Cliente',
      telefone: '85988888888',
      senha: senhaHash,
      barbeariaId: barbearia.id,
      role: UserRole.CLIENTE,
    },
    create: {
      nome: 'Guilherme Cliente',
      email: 'cliente@teste.com',
      senha: senhaHash,
      telefone: '85988888888',
      barbeariaId: barbearia.id,
      role: UserRole.CLIENTE,
    },
  });

  await prisma.cliente.upsert({
    where: { email: 'admin@teste.com' },
    update: {
      nome: 'Administrador ProBarber',
      telefone: '85997777777',
      senha: senhaHash,
      barbeariaId: barbearia.id,
      role: UserRole.ADMIN,
    },
    create: {
      nome: 'Administrador ProBarber',
      email: 'admin@teste.com',
      senha: senhaHash,
      telefone: '85997777777',
      barbeariaId: barbearia.id,
      role: UserRole.ADMIN,
    },
  });

  console.log('Seed finalizado com sucesso.');
}

main()
  .catch((error) => {
    console.error('Erro ao rodar o seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
