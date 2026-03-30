import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './swagger.json' with { type: 'json' }; 

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-probarber-ufc';

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

// --- ROTAS ---

app.post('/api/auth/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, telefone, barbeariaId } = req.body;
    const senhaHash = await bcrypt.hash(senha, 10);
    await prisma.cliente.create({ data: { nome, email, senha: senhaHash, telefone, barbeariaId } });
    return res.status(201).json({ message: 'Cliente cadastrado com sucesso!' });
  } catch (error) {
    return res.status(400).json({ error: 'Erro ao cadastrar.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const cliente = await prisma.cliente.findUnique({ where: { email } });
    if (!cliente || !(await bcrypt.compare(senha, cliente.senha))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    const token = jwt.sign({ id: cliente.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ cliente: { id: cliente.id, nome: cliente.nome, email: cliente.email }, token });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no login.' });
  }
});

app.get('/api/agendamentos/disponibilidade', async (req, res) => {
  try {
    const { profissionalId, data } = req.query;
    if (!profissionalId || !data) return res.status(400).json({ error: 'Faltam parâmetros.' });
    const slotsPadrao = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
    const inicioDia = new Date(`${data}T00:00:00.000Z`);
    const fimDia = new Date(`${data}T23:59:59.999Z`);
    const ocupados = await prisma.agendamento.findMany({
      where: { profissionalId: profissionalId as string, status: { not: 'CANCELADO' }, dataHora: { gte: inicioDia, lte: fimDia } }
    });
    const horasOcupadas = ocupados.map(ag => ag.dataHora.toISOString().substring(11, 16));
    const disponiveis = slotsPadrao.filter(h => !horasOcupadas.includes(h));
    return res.json({ data, profissionalId, disponiveis });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao calcular disponibilidade.' });
  }
});

app.post('/api/agendamentos', autenticacaoMiddleware, async (req: any, res: any) => {
  try {
    const { dataHora, barbeariaId, profissionalId, servicoId } = req.body;
    const dataAg = new Date(dataHora);
    const conflito = await prisma.agendamento.findFirst({
      where: { profissionalId, dataHora: dataAg, status: { not: 'CANCELADO' } }
    });
    if (conflito) return res.status(409).json({ error: 'Horário ocupado.' });
    const ag = await prisma.agendamento.create({
      data: { dataHora: dataAg, barbeariaId, profissionalId, clienteId: req.clienteIdLogado, servicoId },
      include: { profissional: true, servico: true }
    });
    return res.status(201).json(ag);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao agendar.' });
  }
});

app.get('/api/financeiro/profissional/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inicioQuery = req.query.inicio as string | undefined;
    const fimQuery = req.query.fim as string | undefined;

    const whereClause: any = { profissionalId: id, status: 'CONCLUIDO' };
    if (inicioQuery || fimQuery) {
      whereClause.dataHora = {
        ...(inicioQuery && { gte: new Date(inicioQuery) }),
        ...(fimQuery && { lte: new Date(fimQuery) }),
      };
    }

    const ags = await prisma.agendamento.findMany({
      where: whereClause,
      include: { servico: true, profissional: true }
    });

    if (!ags || ags.length === 0) {
      return res.json({ faturamentoTotal: 0, valorComissao: 0, totalAtendimentos: 0 });
    }

    const total = ags.reduce((acc, cur: any) => acc + (cur.servico?.preco || 0), 0);
    const comissao = (total * (ags[0] as any).profissional.comissao) / 100;

    return res.json({ 
        profissional: (ags[0] as any).profissional.nome,
        faturamentoTotal: total, 
        valorComissao: comissao, 
        totalAtendimentos: ags.length 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no financeiro.' });
  }
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`🚀 ProBarber rodando na porta ${PORT}`);
  console.log(`📑 Documentação: http://localhost:${PORT}/api-docs`);
});