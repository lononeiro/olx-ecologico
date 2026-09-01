# Relatório de Revisão dos Diagramas — ECOnecta

**Data:** 2026-08-10
**Motivo:** a regra de negócio "solicitação de coleta precisa ser aprovada/rejeitada pelo
administrador antes de ficar disponível" **não existe mais** no código. Hoje (`solicitacao.service.ts`
→ `criarSolicitacao`) toda solicitação nasce **já `status="aprovada"`, `aprovado=true`** — publicada
imediatamente no marketplace, sem fila de moderação prévia. O administrador só age **reativamente**:
`removerSolicitacao` (`DELETE /api/admin/solicitacoes/[id]`) marca `aprovado=false`,
`status="removida"` quando identifica abuso.

Este relatório documenta (1) o que já foi corrigido nesta revisão e (2) o que ainda precisa de
atenção, para os dois conjuntos de documentação do projeto:

- **`docs/uml/`** (= `uml/`, cópia idêntica na raiz) — documentação UML "viva", completa e já
  assumida como atualizada pelo próprio `docs/uml/README.md`.
- **`docs/APENDICE-A..H*.md`** + **`docs/diagrams/*.mmd|*.puml`** — os apêndices originais do TCC
  (mais antigos, menor cobertura).

---

## 1. O que foi corrigido nesta revisão

### 1.1 `docs/uml/` (e espelho `uml/`) — 17 arquivos

| Arquivo | Mudança |
|---|---|
| `1-casos-de-uso/casos-de-uso.puml` | UC17 "Analisar solicitações" → "Monitorar solicitações"; UC18 "Aprovar/rejeitar" → "Remover solicitação (moderação reativa)" |
| `1-casos-de-uso/descricoes-casos-de-uso.md` | Tabela resumo (UC17/UC18); lista de tipos de notificação (removido `solicitacao_aprovada`/`solicitacao_rejeitada`, que não existem no código); exceção de cancelamento (`rejeitada` → `removida`) |
| `2-classes-de-dados/classes-de-dados.puml` | `status = "pendente"` → `"aprovada"`; `aprovado = false` → `true` |
| `3-atividades/atividades.puml` (atividade-macro) | Removida a bifurcação "Admin analisa → Aprovada?"; adicionado ramo de remoção reativa logo após a publicação; cancelamento (`atividade-cancelar`): `rejeitada ou cancelada?` → `cancelada ou removida?` |
| `4-sequencia/SEQ-05-criar-solicitacao.puml` | `create Solicitacao (pendente, aprovado=false)` → `(aprovada, aprovado=true)` |
| `4-sequencia/SEQ-06-listar-solicitacoes.puml` | Removida a descrição fictícia de "escopo de moderação (rejeitadas/pendentes>24h)"; admin agora lista **todas** as solicitações sem filtro |
| `4-sequencia/SEQ-07-moderar-solicitacao.puml` | **Reescrito por completo**: `PATCH {aprovado}` + `atualizarStatusSolicitacao` (inexistente) → `DELETE` + `removerSolicitacao` + `notificarSolicitacaoRemovida` |
| `4-sequencia/SEQ-08-cancelar-solicitacao.puml` | `status rejeitada/cancelada?` → `cancelada/removida?` |
| `4-sequencia/sequencias.md` | Textos de SEQ-05/06/07/08 reescritos para bater com o código |
| `5-entidade-relacionamento/der.puml` | `status = 'pendente'` → `'aprovada'`; `aprovado = false` → `true` |
| `6-dicionario-de-dados/dicionario-de-dados.md` | Domínio de `status` (`pendente/aprovada/rejeitada/cancelada` → `aprovada/cancelada/removida`); `notificacoes.tipo` (removidos `solicitacao_aprovada`/`solicitacao_rejeitada`, que não existem em `notificacao.service.ts`) |
| `7-classes-participantes/CP-04-moderar-solicitacao.puml` | `PATCH` + `atualizarStatusSolicitacao` → `DELETE` + `removerSolicitacao` + `notificarSolicitacaoRemovida`; adicionada entidade `Notificacao` |
| `7-classes-participantes/classes-participantes.md` | Linha da tabela CP-04 atualizada |
| `8-arquitetura/classes-com-servicos.puml` | Mesmo default de `status`/`aprovado` |
| `8-arquitetura/estados.puml` (estado-solicitacao) | **Reescrito**: removidos o estado `pendente` e as transições "admin aprova/rejeita"; fluxo agora é `[*] → aprovada → {cancelada \| removida \| Coleta}` |
| `documentacao-uml-completa.md` | Documento mestre: todas as ocorrências acima (prosa da seção 1, 2, 4, 5, 6; RF012; RN003/RN011/RN017; diagramas embutidos de casos de uso, classes, ER, sequência SEQ-05/07, atividades, estados; tabelas de endpoints e telas — seções 15–17) |
| `glossario.md` | Definições de "Administrador", "Moderação", `SolicitacaoColeta.status`/`.aprovado`, `Notificacao.tipo` |
| `matriz-rastreabilidade.md` | RF012: `PATCH` → `DELETE`, `atualizarStatusSolicitacao` → `removerSolicitacao`, RN18→RN17 |
| `01-visao-geral.md` | Frase do "fluxo central" reescrita |

### 1.2 Apêndices originais A–H (`docs/APENDICE-*.md` + `docs/diagrams/*`) — 11 arquivos

| Arquivo | Mudança |
|---|---|
| `APENDICE-A-casos-de-uso.md` + `diagrams/APENDICE-A-1.puml` | Mesmo ajuste de UC17/UC18 do item 1.1 |
| `APENDICE-B-descricoes-casos-de-uso.md` | UC05 pós-condição (`pendente/false` → `aprovada/true`); seção **UC17/UC18 reescrita** ("Analisar e aprovar/rejeitar" → "Monitorar e remover — moderação reativa") |
| `APENDICE-D-atividades.md` + `diagrams/APENDICE-D-1.mmd` | Fluxograma Mermaid: removido o nó "Administrador analisa/Aprovar?"; adicionado ramo de remoção reativa a qualquer momento |
| `APENDICE-E-sequencia.md` + `diagrams/APENDICE-E-1.mmd` + `E-2.mmd` | E.1: `status=pendente` → `aprovada`; **E.2 reescrito por completo** (era "Aprovar/rejeitar" via `PATCH`, virou "Remover — moderação reativa" via `DELETE` + notificação) |
| `APENDICE-F-entidade-relacionamento.md` + `diagrams/APENDICE-F-1.mmd` | Defaults do ER (`pendente/false` → `aprovada/true`) |
| `APENDICE-G-dicionario-de-dados.md` | Domínio de `status` e descrição de `aprovado` (também corrigido: faltava o valor `cancelada`, que existe desde sempre e não estava listado) |
| `APENDICE-H-classes-participantes.md` + `diagrams/APENDICE-H-2.mmd` | Seção H.2 reescrita: `PATCH`/`atualizarStatusSolicitacao` → `DELETE`/`removerSolicitacao`/`notificarSolicitacaoRemovida` |
| `docs/README.md` | Descrição do papel do Administrador |
| `docs/casos-de-uso-lista.md` | CDU18 (renomeado), CDU33 (renomeado), CDU34 (renomeado para remoção reativa), **CDU35 marcado como descontinuado** (ação de "rejeitar" não existe mais — números não foram recuados para não quebrar referências a CDU36+) |

**Total: 28 arquivos-fonte distintos corrigidos** (34 contando o espelho `docs/uml` ⇄ `uml`).

---

## 2. O que NÃO foi alterado e por quê

- **Imagens renderizadas (`render/*.png`, `render/*.svg`, `docs/diagrams/*.png`)** continuam com o
  conteúdo antigo — elas são geradas a partir dos `.puml`/`.mmd` por uma ferramenta externa
  (PlantUML `.jar` / Mermaid CLI) que não está disponível neste ambiente (sem acesso à internet para
  baixar o `plantuml.jar`, sem `mmdc` instalado). **Ação necessária:** re-renderizar antes de usar as
  imagens na apresentação/TCC. O comando já está documentado em `docs/uml/README.md` (seção
  "Re-renderizar"); para os `.mmd`, basta colar em <https://mermaid.live> e exportar PNG/SVG.
- **Os `.docx` exportados** (`docs/Casos-de-Uso-ECOnecta*.docx`, `docs/MODELO TCC SI*.docx`,
  `docs/uml/word/*.docx`) também ficaram desatualizados em relação ao texto novo — foram gerados por
  `docs/uml/gerar_docx.py`, que não pude executar aqui (dependências Python não verificadas). Rodar
  esse script novamente após revisar as imagens.
- **`packages/shared/src/status.ts`** (código real, não diagrama) ainda declara
  `STATUS_SOLICITACAO = ["pendente", "aprovada", "rejeitada", "cancelada", "removida"]` — os valores
  `pendente` e `rejeitada` são **mortos** (nenhum service atribui esses valores a uma
  `SolicitacaoColeta`; o único lugar vivo que ainda checa `"rejeitada"` defensivamente é
  `cancelarSolicitacao`, que também já checa `"removida"`). Isso é código, não diagrama — fica fora do
  escopo pedido, mas é a causa raiz de por que tantos diagramas ainda citavam esses valores. Recomendo
  uma limpeza futura desse enum.

---

## 3. Outros problemas encontrados na revisão (não relacionados à aprovação do admin)

Revisei também os diagramas que **não** mudaram por causa da aprovação, para responder ao pedido de
"revisar todos os diagramas". Achados adicionais, sem relação com a regra de aprovação:

| # | Achado | Onde | Severidade |
|---|--------|------|------------|
| 1 | **Três esquemas de numeração de caso de uso incompatíveis coexistem no projeto**: `1-casos-de-uso/casos-de-uso.puml` usa UC01–UC25 (empresa = UC10 "Ver solicitações"); o diagrama embutido em `documentacao-uml-completa.md` usa UC1–UC41 (cidadão = UC10 "Criar solicitação" — número igual, ator e significado diferentes!); `docs/casos-de-uso-lista.md` usa CDU01–CDU40+. `matriz-rastreabilidade.md` segue o segundo esquema. Isso já existia antes desta revisão. | Todo o pacote de casos de uso | **Médio** — confuso para quem for ler o TCC, pode gerar pergunta da banca |
| 2 | **Bug de documentação conhecido, mas não propagado a todos os diagramas**: o backend **não valida** o `codigoConfirmacao` ao concluir uma coleta (`atualizarStatusColeta` apenas grava o status, sem comparar o código). Isso já está corrigido em `docs/uml/4-sequencia/SEQ-11-atualizar-coleta.puml` e citado no `docs/uml/README.md`, mas o apêndice original **`APENDICE-E.4`** (`docs/APENDICE-E-sequencia.md`) ainda modela um `alt Código ausente ou inválido / Código correto` que não existe de fato. | `docs/APENDICE-E-sequencia.md` (seção E.4) | **Médio** — afeta a fidelidade do apêndice original ao código real |
| 3 | **`docs/uml/` e `uml/` (raiz) são uma cópia 100% duplicada** (169 arquivos, byte-idênticos antes desta revisão). Toda edição futura precisa ser feita nos dois lugares (eu sincronizei manualmente após cada rodada de mudanças nesta revisão). Risco de dessincronia se alguém editar só um dos dois no futuro. | `docs/uml/` vs `uml/` | **Baixo/Médio** — risco de manutenção, não de conteúdo |
| 4 | **`docs/APENDICE-G-dicionario-de-dados.md`** não listava o valor `cancelada` no domínio de `solicitacao_coleta.status`, mesmo esse status existindo desde a feature de cancelamento (já corrigido nesta revisão, junto com a troca pendente→aprovada). | `docs/APENDICE-G-dicionario-de-dados.md` | **Baixo** — já corrigido de brinde |
| 5 | **Tabela de rotas em `documentacao-uml-completa.md`** listava `DELETE/PATCH /api/solicitacoes/[id]` para cancelamento, mas a rota real só implementa `GET` e `PATCH` (confirmado em `src/app/api/solicitacoes/[id]/route.ts`). Já corrigido nesta revisão. | `documentacao-uml-completa.md` (seção 16) | **Baixo** — já corrigido de brinde |
| 6 | **Seção 18 ("Análise de Qualidade")** do `documentacao-uml-completa.md` já lista "Consistência de status" como ponto de atenção (`String` livre no banco, sem `enum`/`CHECK`) — este relatório reforça essa recomendação, já que a causa raiz do achado #1 do item 2 acima (enum morto em `packages/shared/src/status.ts`) é exatamente esse tipo de problema. | — | informativo |

---

## 4. Recomendação de próximos passos

1. **Re-renderizar** todas as imagens tocadas (lista completa no item 1) com PlantUML/Mermaid antes de
   colar no documento final do TCC — as `.png`/`.svg` atuais ainda mostram o fluxo antigo.
2. Rodar `docs/uml/gerar_docx.py` de novo para atualizar os `.docx` exportados, se ainda forem usados.
3. Decidir sobre o achado #1 (numeração de UC): unificar em um único esquema ou, no mínimo, deixar
   explícito no início de cada documento que os números não correspondem entre si.
4. Opcional: aplicar a correção do achado #2 (`APENDICE-E.4`) para manter os apêndices originais
   fiéis ao comportamento real do backend, como já foi feito em `docs/uml/`.
5. Opcional: remover `pendente` e `rejeitada` de `packages/shared/src/status.ts` (código, não
   diagrama) para eliminar a fonte do problema que motivou esta revisão.
