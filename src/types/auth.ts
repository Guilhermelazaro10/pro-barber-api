import type { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  barbeariaId: string;
  role: UserRole;
}
