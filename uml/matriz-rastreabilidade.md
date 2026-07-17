# Matriz de Rastreabilidade — ECOnecta

Relaciona Requisitos Funcionais (RF) ↔ Casos de Uso (UC) ↔ Entidades ↔ Endpoints ↔ Telas ↔ Regras de Negócio (RN) ↔ Arquivos reais.

| RF | Caso de Uso | Entidade | Endpoint | Tela | Regra | Arquivo principal |
|----|-------------|----------|----------|------|-------|-------------------|
| RF001 | UC1 Cadastrar-se | User, Company, Role | `POST /api/auth/register` | `/register` | RN001*, RN015 | `src/app/api/auth/register/route.ts`, `lib/mobile-auth.ts` |
| RF002 | UC1 | User | `GET /api/auth/check-email` | `/register` | — | `src/app/api/auth/check-email/route.ts` |
| RF003 | UC2 Autenticar | User, Role | `POST /api/auth/[...nextauth]` | `/login` | RN001, RN002, RN015 | `lib/auth.ts`, `lib/mobile-auth.ts` |
| RF004 | UC2 | User | `POST /api/auth/mobile/login` | (mobile) `login.tsx` | RN015, RN016 | `src/app/api/auth/mobile/login/route.ts` |
| RF005 | UC2 | User | `POST /api/auth/mobile/refresh` | (mobile) | — | `src/app/api/auth/mobile/refresh/route.ts` |
| RF006 | UC3 Recuperar senha | User (`resetToken`) | `POST /api/auth/forgot-password`, `/reset-password` | `/forgot-password`, `/reset-password` | — | `src/app/api/auth/forgot-password/route.ts` |
| RF007 | — Perfil | User, Company | `GET/PATCH /api/users/me` | `/me` | RN002 | `src/app/api/users/me/route.ts` |
| RF008 | UC10 Criar solicitação | SolicitacaoColeta, SolicitacaoImagem, MaterialTipo | `POST /api/solicitacoes` | `/dashboard/solicitacoes/nova` | RN003, RN004 | `services/solicitacao.service.ts` |
| RF009 | UC13/UC30 Listar | SolicitacaoColeta | `GET /api/solicitacoes` | `/dashboard/solicitacoes`, `/admin/solicitacoes`, `/empresa/solicitacoes` | RN002, RN005, RN014, RN017 | `src/app/api/solicitacoes/route.ts` |
| RF010 | UC13 Consultar | SolicitacaoColeta | `GET /api/solicitacoes/[id]` | `/dashboard/solicitacoes/[id]` | RN002 | `src/app/api/solicitacoes/[id]/route.ts` |
| RF011 | UC14 Cancelar | SolicitacaoColeta, Coleta | `PATCH/DELETE /api/solicitacoes/[id]` | `/dashboard/solicitacoes/[id]` | RN011 | `services/solicitacao.service.ts` (`cancelarSolicitacao`) |
| RF012 | UC20 Moderar | SolicitacaoColeta, Notificacao | `PATCH /api/admin/solicitacoes/[id]` | `/admin/solicitacoes/[id]` | RN018 | `src/app/api/admin/solicitacoes/[id]/route.ts` |
| RF013 | UC30 Marketplace | SolicitacaoColeta | `GET /api/solicitacoes` (empresa) | `/empresa/solicitacoes` | RN005, RN014 | `listarSolicitacoesAprovadas` |
| RF014 | UC32 Aceitar | Coleta, ConversaSolicitacao, Notificacao | `POST /api/empresa/coletas` | `/empresa/solicitacoes` | RN006, RN007, RN008 | `services/coleta.service.ts` (`aceitarSolicitacao`) |
| RF015 | UC34 Atualizar status | Coleta, Notificacao | `PATCH /api/empresa/coletas/[id]` | `/empresa/coletas/[id]` | RN009 | `services/coleta.service.ts` (`atualizarStatusColeta`) |
| RF016 | UC34 Coletas | Coleta | `GET /api/empresa/coletas`, `/[id]` | `/empresa/coletas` | RN002 | `src/app/api/empresa/coletas/route.ts` |
| RF017 | UC31 Chat pré-aceite | ConversaSolicitacao, MensagemPreAceite | `POST /api/conversas-solicitacao/[id]/mensagens` | `/empresa/solicitacoes/[id]/conversa` | RN012, RN019 | `services/conversa-solicitacao.service.ts` |
| RF018 | UC40 Chat coleta | Mensagem, Coleta | `GET/POST /api/mensagens/[id]` | `/empresa/coletas/[id]` | RN013, RN019 | `services/mensagem.service.ts` |
| RF019 | UC40 Inbox | Mensagem, MensagemPreAceite | `GET /api/mensagens/inbox` | `/dashboard/mensagens`, `/empresa/mensagens` | RN013 | `services/mensagens-inbox.service.ts` |
| RF020 | UC15 Avaliar | Avaliacao, Coleta, Notificacao | `POST /api/avaliacoes` | `/dashboard/solicitacoes/[id]` | RN010 | `services/avaliacao.service.ts` |
| RF021 | UC35 Reputação | Avaliacao, Company | `GET /api/avaliacoes/empresa/[companyId]` | `/empresa/avaliacoes` | RN020 | `services/avaliacao.service.ts` |
| RF022 | — Materiais | MaterialTipo | `GET /api/materiais` | `/dashboard/solicitacoes/nova` | — | `src/app/api/materiais/route.ts` |
| RF023 | UC12 CEP | — | `GET /api/cep/[cep]` | forms de endereço | — | `src/app/api/cep/[cep]/route.ts` |
| RF024 | UC41 Notificações | Notificacao | `GET /api/notificacoes/stream`, `PATCH /[id]` | `NotificationBell` (todas) | RN018 | `src/app/api/notificacoes/stream/route.ts` |
| RF025 | UC23 Dashboard | User, Company, SolicitacaoColeta, Coleta | `GET /api/admin/dashboard` | `/admin` | RN002 | `src/app/api/admin/dashboard/route.ts` |
| RF026 | UC21/UC22 CRUD admin | User, Company, MaterialTipo | `/api/admin/users\|companies\|materiais` | `/admin/usuarios\|empresas\|materiais` | RN002 | `src/app/api/admin/**` |

> \* RN001 (acesso protegido) aplica-se transversalmente a quase todos os RF autenticados via `middleware.ts` + `route-guard.ts`.
