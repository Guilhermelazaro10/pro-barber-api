import type { UserRole } from '@prisma/client';

interface UserSummaryInput {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  role: UserRole;
  barbeariaId: string;
}

interface UserProfileInput extends UserSummaryInput {
  criadoEm: Date;
}

interface AuthSessionInput {
  user: UserSummaryInput;
  token: string;
}

export const presentUserSummary = (user: UserSummaryInput) => ({
  id: user.id,
  nome: user.nome,
  email: user.email,
  telefone: user.telefone,
  role: user.role,
  barbeariaId: user.barbeariaId,
});

export const presentUserProfile = (user: UserProfileInput) => ({
  ...presentUserSummary(user),
  criadoEm: user.criadoEm,
});

export const presentAuthSession = (session: AuthSessionInput) => ({
  user: presentUserSummary(session.user),
  token: session.token,
});
