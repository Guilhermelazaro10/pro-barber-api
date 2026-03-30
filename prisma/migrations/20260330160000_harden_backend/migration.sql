CREATE TYPE "UserRole" AS ENUM ('CLIENTE', 'ADMIN');
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDENTE', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO');

ALTER TABLE "clientes"
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CLIENTE',
  ADD COLUMN "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "agendamentos"
  ADD COLUMN "precoCobrado" DOUBLE PRECISION,
  ADD COLUMN "duracaoMinutos" INTEGER,
  ADD COLUMN "concluidoEm" TIMESTAMP(3),
  ADD COLUMN "canceladoEm" TIMESTAMP(3),
  ADD COLUMN "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "agendamentos" AS a
SET
  "precoCobrado" = s."preco",
  "duracaoMinutos" = s."duracaoMinutos"
FROM "servicos" AS s
WHERE s."id" = a."servicoId";

ALTER TABLE "agendamentos"
  ALTER COLUMN "precoCobrado" SET NOT NULL,
  ALTER COLUMN "duracaoMinutos" SET NOT NULL;

ALTER TABLE "agendamentos" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "agendamentos"
  ALTER COLUMN "status" TYPE "AppointmentStatus"
  USING ("status"::"AppointmentStatus");
ALTER TABLE "agendamentos"
  ALTER COLUMN "status" SET DEFAULT 'PENDENTE';

CREATE INDEX "agendamentos_profissionalId_dataHora_idx" ON "agendamentos"("profissionalId", "dataHora");
CREATE INDEX "agendamentos_barbeariaId_dataHora_idx" ON "agendamentos"("barbeariaId", "dataHora");