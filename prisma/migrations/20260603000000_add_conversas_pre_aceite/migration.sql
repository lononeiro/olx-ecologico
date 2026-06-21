CREATE TABLE "conversas_solicitacao" (
    "id" SERIAL NOT NULL,
    "solicitacaoId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversas_solicitacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mensagens_pre_aceite" (
    "id" SERIAL NOT NULL,
    "conversaId" INTEGER NOT NULL,
    "remetenteId" INTEGER NOT NULL,
    "mensagem" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_pre_aceite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversas_solicitacao_solicitacaoId_companyId_key"
ON "conversas_solicitacao"("solicitacaoId", "companyId");

ALTER TABLE "conversas_solicitacao"
ADD CONSTRAINT "conversas_solicitacao_solicitacaoId_fkey"
FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacao_coleta"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "conversas_solicitacao"
ADD CONSTRAINT "conversas_solicitacao_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mensagens_pre_aceite"
ADD CONSTRAINT "mensagens_pre_aceite_conversaId_fkey"
FOREIGN KEY ("conversaId") REFERENCES "conversas_solicitacao"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mensagens_pre_aceite"
ADD CONSTRAINT "mensagens_pre_aceite_remetenteId_fkey"
FOREIGN KEY ("remetenteId") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
