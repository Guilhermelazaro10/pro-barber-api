ALTER TABLE "profissionais"
  ALTER COLUMN "comissao" TYPE DECIMAL(5, 2)
  USING ROUND("comissao"::numeric, 2);

ALTER TABLE "servicos"
  ALTER COLUMN "preco" TYPE DECIMAL(10, 2)
  USING ROUND("preco"::numeric, 2);

ALTER TABLE "agendamentos"
  ALTER COLUMN "precoCobrado" TYPE DECIMAL(10, 2)
  USING ROUND("precoCobrado"::numeric, 2);
