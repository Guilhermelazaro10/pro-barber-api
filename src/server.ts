import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import { z } from 'zod';
import swaggerDocs from './swagger.json' with { type: 'json' };

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-probarber-ufc';

// --- SCHEMAS DE VALIDAÇÃO (ZOD) ---
const cadastroSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Formato de e-mail inválido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  telefone: z.string().min(10, "Telefone inválido (mínimo 10 dígitos)"),
  barbeariaId: z.string().uuid("ID da barbearia deve ser um UUID válido")
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "A senha é obrigatória")
});

const agendamentoSchema = z.object({
  dataHora: z.string().datetime("Formato de data/hora ISO inválido"),
  barbeariaId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  servicoId: z.string().uuid()
});

// --- CONFIGURAÇÃO DO SWAGGER ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
const autenticacaoMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });
  const [, token] = authHeader.split(' ');
  try {
    const decodificado = jwt.verify(token, JWT_SECRET) as { id: string };
    req.clienteIdLogado = decodificado.id;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/auth/cadastro', async (req, res) => {
  try {
    const dados = cadastroSchema.parse(req.body);
    const senhaHash = await bcrypt.hash(dados.senha, 10);
    await prisma.cliente.create({ data: { ...dados, senha: senhaHash } });
    return res.status(201).json({ message: 'Cliente cadastrado com sucesso!' });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.issues.map(e => e.message) });
    return res.status(400).json({ error: 'Erro ao cadastrar. E-mail já existe.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = loginSchema.parse(req.body);
    const cliente = await prisma.cliente.findUnique({ where: { email } });
    if (!cliente || !(await bcrypt.compare(senha, cliente.senha))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    const token = jwt.sign({ id: cliente.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ cliente: { id: cliente.id, nome: cliente.nome, email: cliente.email }, token });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.issues.map(e => e.message) });
    return res.status(500).json({ error: 'Erro interno no login.' });
  }
});

// --- ROTAS DE AGENDAMENTO ---

app.get('/api/agendamentos/meus', autenticacaoMiddleware, async (req: any, res: any) => {
  try {
    const agendamentos = await prisma.agendamento.findMany({
      where: { clienteId: req.clienteIdLogado },
      include: {
        barbearia: { select: { nomeFantasia: true } },
        profissional: { select: { nome: true } },
        servico: { select: { nome: true, preco: true } }
      },
      orderBy: { dataHora: 'desc' }
    });
    return res.json(agendamentos);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar seu histórico.' });
  }
});

app.post('/api/agendamentos', autenticacaoMiddleware, async (req: any, res: any) => {
  try {
    const dados = agendamentoSchema.parse(req.body);
    const dataAg = new Date(dados.dataHora);
    
    const conflito = await prisma.agendamento.findFirst({
      where: { profissionalId: dados.profissionalId, dataHora: dataAg, status: { not: 'CANCELADO' } }
    });

    if (conflito) return res.status(409).json({ error: 'Horário ocupado.' });

    const ag = await prisma.agendamento.create({
      data: { ...dados, dataHora: dataAg, clienteId: req.clienteIdLogado },
      include: { profissional: true, servico: true }
    });
    return res.status(201).json(ag);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.issues.map(e => e.message) });
    return res.status(500).json({ error: 'Erro ao agendar.' });
  }
});

// --- ROTA DE STATUS ---

app.patch('/api/agendamentos/:id/concluir', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.agendamento.update({
      where: { id },
      data: { status: 'CONCLUIDO' }
    });
    return res.json({ message: 'Agendamento concluído com sucesso!' });
  } catch (error) {
    return res.status(400).json({ error: 'Erro ao concluir agendamento.' });
  }
});

// --- INTELIGÊNCIA E FINANCEIRO ---

app.get('/api/financeiro/profissional/:id/top-servicos', async (req, res) => {
  try {
    const { id } = req.params;
    
    const topServicosRaw = await prisma.agendamento.groupBy({
      by: ['servicoId'],
      where: { profissionalId: id, status: 'CONCLUIDO' },
      _count: { servicoId: true },
      orderBy: { _count: { servicoId: 'desc' } },
      take: 3,
    });

    const topServicos = await Promise.all(
      topServicosRaw.map(async (item) => {
        const servico = await prisma.servico.findUnique({
          where: { id: item.servicoId },
          select: { nome: true }
        });
        return { nome: servico?.nome || "Serviço", total: item._count.servicoId };
      })
    );

    return res.json(topServicos);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar top serviços.' });
  }
});

app.get('/api/financeiro/profissional/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inicio = req.query.inicio as string;
    const fim = req.query.fim as string;

    const whereClause: any = { profissionalId: id, status: 'CONCLUIDO' };
    if (inicio || fim) {
      whereClause.dataHora = {
        ...(inicio && { gte: new Date(inicio) }),
        ...(fim && { lte: new Date(fim) }),
      };
    }

    const ags = await prisma.agendamento.findMany({
      where: whereClause,
      include: { servico: true, profissional: true }
    });

    if (!ags.length) return res.json({ faturamentoTotal: 0, valorComissao: 0, totalAtendimentos: 0 });

    const total = ags.reduce((acc, cur: any) => acc + (cur.servico?.preco || 0), 0);
    const comissao = (total * (ags[0] as any).profissional.comissao) / 100;

    return res.json({ 
        profissional: (ags[0] as any).profissional.nome,
        faturamentoTotal: total, 
        valorComissao: comissao, 
        totalAtendimentos: ags.length 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro no financeiro.' });
  }
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`🚀 ProBarber rodando em http://localhost:${PORT}`);
  console.log(`📑 Documentação: http://localhost:${PORT}/api-docs`);
});