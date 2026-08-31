-- Avaliação bidirecional: além do cidadão avaliar a empresa, a empresa passa a
-- avaliar o cidadão. Cada coleta admite uma avaliação por direção (`tipo`).
ALTER TABLE "avaliacoes" ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'usuario_para_empresa';

-- Troca a unicidade de (coletaId) para (coletaId, tipo).
DROP INDEX "avaliacoes_coletaId_key";
CREATE UNIQUE INDEX "avaliacoes_coletaId_tipo_key" ON "avaliacoes"("coletaId", "tipo");
