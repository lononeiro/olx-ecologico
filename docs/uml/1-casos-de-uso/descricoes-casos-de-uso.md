# Descrições de Casos de Uso — ECOnecta

Descrição dos casos de uso do **ECOnecta**, fiel às validações (`packages/shared/src/validations.ts`),
aos serviços (`src/services`) e às rotas de API (`src/app/api`).

> **Atualizado** em relação ao APÊNDICE B: acrescentados **UC22 Cancelar**, **UC23 Avaliar**,
> **UC24 Negociar (pré-aceite)**, **UC25 Ver avaliações** e o caso comum **UC15 Receber notificações**.

## Resumo

| ID | Caso de uso | Ator(es) |
|----|-------------|----------|
| UC01 | Cadastrar-se | Cidadão, Empresa |
| UC02 | Autenticar (Login) | Todos |
| UC03 | Recuperar senha | Cidadão, Empresa |
| UC04 | Visualizar e editar perfil | Cidadão, Empresa |
| UC05 | Criar solicitação de coleta | Cidadão |
| UC06 | Anexar imagens (até 5) | Cidadão |
| UC07 | Listar minhas solicitações | Cidadão |
| UC08 | Acompanhar status da coleta | Cidadão |
| UC09 | Conversar na coleta | Cidadão, Empresa |
| UC10 | Ver solicitações aprovadas disponíveis | Empresa |
| UC11 | Aceitar solicitação | Empresa |
| UC12 | Listar minhas coletas | Empresa |
| UC13 | Atualizar status da coleta | Empresa |
| UC14 | Concluir coleta com código | Empresa |
| UC15 | Receber notificações | Cidadão, Empresa |
| UC16 | Visualizar dashboard | Administrador |
| UC17 | Analisar solicitações | Administrador |
| UC18 | Aprovar / rejeitar solicitação | Administrador |
| UC19 | Gerenciar usuários | Administrador |
| UC20 | Gerenciar empresas | Administrador |
| UC21 | Gerenciar materiais | Administrador |
| UC22 | Cancelar solicitação | Cidadão |
| UC23 | Avaliar coleta concluída | Cidadão |
| UC24 | Negociar antes do aceite (chat pré-aceite) | Cidadão, Empresa |
| UC25 | Ver avaliações recebidas (reputação) | Empresa |

> As descrições de **UC01–UC21** estão detalhadas no APÊNDICE B (`../../APENDICE-B-descricoes-casos-de-uso.md`). Abaixo, apenas os **casos novos**. Há uma correção importante de UC14 ao final.

---

## UC22 — Cancelar solicitação

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Cidadão |
| **Objetivo** | Desistir de uma solicitação que ainda não avançou |
| **Pré-condições** | Ser o dono da solicitação |
| **Pós-condições** | Solicitação `cancelada`; coleta também cancelada se estava em `aceita`/`a_caminho` |

**Fluxo principal**
1. O cidadão abre o detalhe da solicitação e aciona "Cancelar".
2. O sistema (`cancelarSolicitacao`, em transação) carrega a solicitação e a coleta vinculada.
3. Marca a solicitação como `cancelada` e, se houver coleta em `aceita`/`a_caminho`, também a cancela.

**Fluxos de exceção**
- **A1 —** Solicitação já `rejeitada`/`cancelada`: retorna erro "não pode ser cancelada neste estado".
- **A2 —** Coleta em `em_coleta`/`concluida`: retorna erro "coleta já em andamento avançado".

---

## UC23 — Avaliar coleta concluída

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Cidadão |
| **Objetivo** | Registrar a reputação da empresa após a coleta |
| **Pré-condições** | Ser o dono da solicitação; coleta `concluida`; ainda sem avaliação |
| **Pós-condições** | `Avaliacao` criada (nota 1–5); empresa notificada |

**Fluxo principal**
1. Após a conclusão, o cidadão acessa o formulário de avaliação.
2. Informa nota de 1 a 5 e comentário opcional (≤ 500 caracteres).
3. O `criarAvaliacao` valida posse, status concluído e ausência de avaliação prévia, e persiste.
4. A empresa recebe uma notificação `avaliacao_recebida`.

**Fluxos de exceção**
- **A1 —** Não é o dono / coleta não concluída / já avaliada: retorna erro `400`.

---

## UC24 — Negociar antes do aceite (chat pré-aceite)

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Empresa (inicia) e Cidadão |
| **Objetivo** | Esclarecer detalhes da solicitação antes de aceitar |
| **Pré-condições** | Solicitação aprovada e **sem** coleta |
| **Pós-condições** | `MensagemPreAceite` persistida; destinatário notificado |

**Fluxo principal**
1. A empresa abre a conversa de uma solicitação disponível (cria/reusa `ConversaSolicitacao` com status `aberta`).
2. Empresa e cidadão trocam mensagens (≤ 1000 caracteres cada).
3. A cada envio, o outro participante recebe notificação `nova_mensagem`.

**Fluxos de exceção**
- **A1 —** Conversa não está `aberta` ou solicitação já aceita: o envio é bloqueado.
- **A2 —** Ao aceitar (UC11), a conversa da empresa vencedora vira `convertida` e as demais `encerrada`.

---

## UC25 — Ver avaliações recebidas (reputação)

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Empresa Coletora |
| **Objetivo** | Consultar a média e o histórico de avaliações |
| **Pré-condições** | Estar autenticado como `empresa` |
| **Pós-condições** | — (consulta) |

**Fluxo principal**
1. A empresa acessa `/empresa/avaliacoes`.
2. O sistema (`listarAvaliacoesDaEmpresa`) calcula a média (1 casa decimal), o total de avaliações, a
   distribuição por nota e lista as coletas concluídas, avaliadas ou não.

---

## UC15 — Receber notificações

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Cidadão, Empresa (e Admin) |
| **Objetivo** | Ser avisado em tempo real de eventos relevantes |
| **Pré-condições** | Estar autenticado |
| **Pós-condições** | Notificações exibidas; contador de não lidas atualizado |

**Fluxo principal**
1. Ao autenticar, o `NotificationBell` abre um `EventSource` para `/api/notificacoes/stream`.
2. O servidor envia o estado inicial e, a cada 4s, novas notificações dos tipos: `solicitacao_aprovada`,
   `solicitacao_rejeitada`, `coleta_aceita`, `coleta_status`, `nova_mensagem`, `avaliacao_recebida`.
3. O usuário pode marcar como lida(s).

> A criação de notificações é *best-effort*: uma falha não interrompe o fluxo principal que a originou.

---

## ⚠️ Correção ao UC14 (Concluir coleta com código)

O APÊNDICE B (UC14) e os apêndices E.4/H.4 afirmam que a conclusão **valida o código de confirmação**.
Na verdade, o serviço real `atualizarStatusColeta` (`src/services/coleta.service.ts`) **não compara o
código** ao concluir — apenas verifica que a coleta pertence à empresa e grava `dataConclusao`. O
`codigoConfirmacao` é gerado no aceite e exibido ao cidadão, mas sua conferência **não está
implementada** no backend. *Recomenda-se* alinhar documentação e código (implementar a checagem **ou**
remover a afirmação). Os diagramas desta pasta refletem o **comportamento real do código**.
