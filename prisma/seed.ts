import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando o Seed de dados...");

  // 1. Criar a Barbearia Matriz (O "coração" do seu SaaS)
  const barbearia = await prisma.barbearia.upsert({
    where: { slugUrl: 'probarber-matriz' },
    update: {},
    create: {
      nomeFantasia: "ProBarber Matriz - UFC",
      slugUrl: "probarber-matriz",
      telefone: "85999999999",
      corPrimaria: "#1A1A1B",
      corSecundaria: "#D4AF37", // Dourado profissional
    },
  });

  // 2. Criar Serviços (Com preços diferentes para testar o faturamento)
  const corte = await prisma.servico.create({
    data: {
      nome: "Corte de Cabelo Moderno",
      preco: 45.00,
      duracaoMinutos: 30,
      barbeariaId: barbearia.id,
    },
  });

  const barba = await prisma.servico.create({
    data: {
      nome: "Barba Completa (Toalha Quente)",
      preco: 35.00,
      duracaoMinutos: 30,
      barbeariaId: barbearia.id,
    },
  });

  // 3. Criar Profissionais (Um com 50% e outro com 30% de comissão)
  const barbeiro1 = await prisma.profissional.create({
    data: {
      nome: "Mestre Cabeludo",
      comissao: 50, // 50% de comissão
      barbeariaId: barbearia.id,
    },
  });

  const barbeiro2 = await prisma.profissional.create({
    data: {
      nome: "Barbeiro Novato",
      comissao: 30, // 30% de comissão
      barbeariaId: barbearia.id,
    },
  });

  // 4. Criar um Cliente de teste (Senha: 123456)
  const senhaHash = await bcrypt.hash('123456', 10);
  await prisma.cliente.create({
    data: {
      nome: "Guilherme Cliente",
      email: "cliente@teste.com",
      senha: senhaHash,
      telefone: "85988888888",
      barbeariaId: barbearia.id,
    },
  });

  console.log("✅ Seed finalizado com sucesso!");
  console.log(`🏠 Barbearia Criada: ${barbearia.nomeFantasia}`);
  console.log(`✂️ Serviços e Barbeiros prontos para uso.`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao rodar o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });