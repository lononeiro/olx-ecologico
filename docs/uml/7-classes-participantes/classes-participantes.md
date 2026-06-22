# Diagramas de Classes Participantes (Análise de Robustez) — ECOnecta

Diagramas de robustez (ICONIX) dos casos de uso principais. Cada um separa as classes em três
estereótipos:

- **«boundary»** (fronteira) — telas e rotas de API que interagem com o ator;
- **«control»** (controle) — regras de negócio: validações (Zod), *services* e *route-guard*;
- **«entity»** (entidade) — dados persistidos (modelos Prisma).

> Gerados em PlantUML (símbolos nativos de boundary/control/entity). Imagens em `render/`.

| # | Caso de uso | Boundary | Control | Entity |
|---|-------------|----------|---------|--------|
| CP-01 | Cadastro | `/register` | `registerSchema`, transação | User, Company, Role |
| CP-02 | Autenticar | `/login`, NextAuth/mobile | `loginSchema`, bcrypt, JWT | User, Role |
| CP-03 | Criar solicitação | Form, Cloudinary, API | `route-guard`, `criarSolicitacao` | SolicitacaoColeta, SolicitacaoImagem, MaterialTipo |
| CP-04 | Moderar solicitação | Admin, PATCH | `atualizarStatusSolicitacao`, notificar | SolicitacaoColeta, Notificacao |
| CP-05 | Negociar (pré-aceite) **novo** | Chat, POST mensagens | `buscarConversaAutorizada`, `enviarMensagem...` | ConversaSolicitacao, MensagemPreAceite, Notificacao |
| CP-06 | Aceitar solicitação | Lista, POST coletas | `aceitarSolicitacao` (transação), código | SolicitacaoColeta, Coleta, ConversaSolicitacao, Notificacao |
| CP-07 | Atualizar/concluir coleta | Detalhe, PATCH | `coletaStatusSchema`, `atualizarStatusColeta` | Coleta, Notificacao |
| CP-08 | Chat da coleta | Chat, POST mensagens | `verificarAcessoColeta`, `enviarMensagem` | Coleta, Mensagem, Notificacao |
| CP-09 | Avaliar coleta **novo** | Form, POST avaliações | `avaliacaoCreateSchema`, `criarAvaliacao` | Coleta, Avaliacao, Notificacao |
| CP-10 | Notificações (SSE) **novo** | NotificationBell, stream | `buscarNotificacoesDesde`, `contarNaoLidas` | Notificacao |

**Cobertura:** os 6 diagramas originais do APÊNDICE H (cadastro, autenticar, criar, moderar, aceitar,
atualizar, chat) foram mantidos e **complementados** com 3 novos (negociar pré-aceite, avaliar,
notificações), totalizando 10 — cobrindo todos os casos de uso principais do sistema atual.
