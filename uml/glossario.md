# Glossário — ECOnecta

## Termos de negócio

| Termo | Definição | Onde aparece |
|-------|-----------|--------------|
| **Cidadão / Usuário** | Pessoa física que possui material reciclável e cria solicitações (`role = usuario`). | `roles`, `prisma/seed.ts` |
| **Empresa Coletora** | Organização que aceita e executa coletas (`role = empresa`). | `Company`, `coleta.service.ts` |
| **Administrador** | Modera solicitações e gerencia o catálogo (`role = admin`). | `api/admin/**` |
| **Solicitação de Coleta** | Pedido criado pelo cidadão com material, quantidade, endereço e imagens. | `SolicitacaoColeta` |
| **Coleta** | Execução de uma solicitação aceita por uma empresa; tem ciclo de vida próprio. | `Coleta` |
| **Material (Tipo)** | Categoria de reciclável (papel, plástico, vidro, e-lixo...). | `MaterialTipo`, `seed.ts` |
| **Avaliação** | Nota (1–5★) e comentário dados pelo cidadão à empresa após a coleta concluída. | `Avaliacao` |
| **Chat pré-aceite (negociação)** | Conversa entre cidadão e empresa antes de a coleta ser aceita. | `ConversaSolicitacao`, `MensagemPreAceite` |
| **Chat da coleta** | Conversa operacional vinculada a uma coleta já aceita. | `Mensagem` |
| **Código de confirmação** | Código de 8 caracteres hex gerado no aceite para validar a coleta presencial. | `coleta.service.ts` |
| **Moderação** | Ato do admin de aprovar ou rejeitar uma solicitação. | `atualizarStatusSolicitacao` |
| **Marketplace de solicitações** | Lista de solicitações aprovadas e sem coleta, visível às empresas. | `listarSolicitacoesAprovadas` |
| **Região (endereço aproximado)** | Versão reduzida do endereço exibida antes do aceite (privacidade). | `lib/privacy.ts` |

## Status (ciclos de vida)

| Entidade | Valores | Fonte |
|----------|---------|-------|
| **SolicitacaoColeta.status** | `pendente`, `aprovada`, `rejeitada`, `cancelada` | `packages/shared/src/status.ts` |
| **SolicitacaoColeta.aprovado** | `true` / `false` (flag de moderação) | `schema.prisma` |
| **Coleta.status** | `aceita`, `a_caminho`, `em_coleta`, `concluida`, `cancelada` | `packages/shared/src/status.ts` |
| **ConversaSolicitacao.status** | `aberta`, `convertida`, `encerrada` | `conversa-solicitacao.service.ts`, `coleta.service.ts` (não centralizado — ver melhorias) |
| **Notificacao.lida** | `true` / `false` | `schema.prisma` |
| **Notificacao.tipo** | `solicitacao_aprovada`, `solicitacao_rejeitada`, `coleta_aceita`, `coleta_status`, `nova_mensagem`, `avaliacao_recebida` | `notificacao.service.ts` |

## Termos técnicos

| Termo | Definição | Onde aparece |
|-------|-----------|--------------|
| **Next.js App Router** | Sistema de rotas baseado em pastas (`src/app/**`) com Server/Client Components. | `src/app/**` |
| **Route Handler** | Endpoint da API definido em `route.ts`. | `src/app/api/**` |
| **NextAuth** | Biblioteca de autenticação; estratégia JWT com provedor Credentials. | `lib/auth.ts` |
| **JWT** | JSON Web Token; usado na sessão web (NextAuth) e na auth mobile (`jose`, HS256). | `lib/auth.ts`, `lib/mobile-auth.ts` |
| **Access / Refresh Token** | Tokens mobile com TTL de 15 min e 30 dias. | `lib/mobile-auth.ts` |
| **route-guard** | Função `autorizarRota` que valida sessão/token e role. | `lib/route-guard.ts` |
| **Middleware** | Intercepta páginas (redirecionamento por role) e aplica CORS na API. | `src/middleware.ts` |
| **Prisma** | ORM TypeScript; `schema.prisma` define o modelo; `prisma generate` cria o client. | `prisma/`, `lib/prisma.ts` |
| **Zod** | Biblioteca de validação de schema usada em entradas de API. | `packages/shared/src/validations.ts` |
| **DTO / Mascaramento** | Objetos de transferência com dados sensíveis ocultados (`maskEmail`, `maskPhone`). | `lib/privacy.ts` |
| **SSE (Server-Sent Events)** | Canal HTTP unidirecional para notificações em tempo real (polling 4s). | `api/notificacoes/stream` |
| **EventSource** | API do navegador que consome o SSE e reconecta com `Last-Event-ID`. | `NotificationBell.tsx` |
| **Cloudinary** | Serviço externo de upload/CDN das imagens das solicitações. | `next-cloudinary`, README |
| **ViaCEP** | API pública de consulta de endereço por CEP. | `api/cep/[cep]/route.ts` |
| **Leaflet** | Biblioteca de mapas usada para exibir o endereço. | `MapaEndereco.tsx` |
| **bcrypt** | Função de hash de senha (custo 12). | `lib/mobile-auth.ts`, `seed.ts` |
| **Monorepo / Workspaces** | `apps/*` (mobile) + `packages/*` (shared) + web na raiz. | `package.json` |
| **packages/shared** | Pacote com Zod, status e contratos reaproveitados por web e mobile. | `packages/shared/src/**` |
| **Expo** | Framework do app mobile React Native. | `apps/mobile/**` |
| **Transação (Prisma `$transaction`)** | Bloco atômico usado no aceite e no cancelamento. | `coleta.service.ts`, `solicitacao.service.ts` |
| **best-effort** | Operação cujo erro é tolerado sem quebrar o fluxo (notificações). | `notificacao.service.ts` |
