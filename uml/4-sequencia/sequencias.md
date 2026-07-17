# Diagramas de Sequência — ECOnecta

Conjunto completo de diagramas de sequência dos **métodos/fluxos principais** da aplicação, na ordem sugerida para o documento. Cada diagrama tem uma imagem em `render/` (PNG e SVG) e um texto descritivo pronto para inserir no TCC.

> Como inserir no Word: **Inserir → Imagem →** `render/SEQ-XX-....png`. Para qualidade vetorial, use o `.svg`.

## Visão de cobertura

| # | Fluxo | Método/handler principal | Ator(es) | Imagem |
|---|-------|--------------------------|----------|--------|
| SEQ-01 | Autenticação web | `lib/auth.ts` + `authenticateUserByCredentials` | Cidadão/Empresa/Admin | `render/SEQ-01-login-web.png` |
| SEQ-02 | Autenticação mobile (login+refresh) | `mobile-auth.ts` | Cidadão/Empresa | `render/SEQ-02-login-mobile.png` |
| SEQ-03 | Cadastro de usuário/empresa | `api/auth/register` | Visitante | `render/SEQ-03-cadastro.png` |
| SEQ-04 | Recuperação de senha | `forgot-password` + `reset-password` | Visitante | `render/SEQ-04-recuperar-senha.png` |
| SEQ-05 | Criar solicitação (upload) | `criarSolicitacao` | Cidadão | `render/SEQ-05-criar-solicitacao.png` |
| SEQ-06 | Listar solicitações (por perfil) | `GET /api/solicitacoes` | Cidadão/Empresa/Admin | `render/SEQ-06-listar-solicitacoes.png` |
| SEQ-07 | Moderar solicitação | `atualizarStatusSolicitacao` | Administrador | `render/SEQ-07-moderar-solicitacao.png` |
| SEQ-08 | Cancelar solicitação | `cancelarSolicitacao` | Cidadão | `render/SEQ-08-cancelar-solicitacao.png` |
| SEQ-09 | Negociar (chat pré-aceite) | `enviarMensagemConversaSolicitacao` | Empresa/Cidadão | `render/SEQ-09-negociar-pre-aceite.png` |
| SEQ-10 | Aceitar solicitação (cria Coleta) | `aceitarSolicitacao` | Empresa | `render/SEQ-10-aceitar-solicitacao.png` |
| SEQ-11 | Atualizar/concluir coleta | `atualizarStatusColeta` | Empresa | `render/SEQ-11-atualizar-coleta.png` |
| SEQ-12 | Conversar na coleta | `enviarMensagem` | Cidadão/Empresa | `render/SEQ-12-chat-coleta.png` |
| SEQ-13 | Avaliar coleta | `criarAvaliacao` | Cidadão | `render/SEQ-13-avaliar-coleta.png` |
| SEQ-14 | Notificações em tempo real (SSE) | `api/notificacoes/stream` | Todos | `render/SEQ-14-notificacoes-sse.png` |
| SEQ-15 | Consultar CEP | `api/cep/[cep]` | Cidadão | `render/SEQ-15-consultar-cep.png` |

---

## SEQ-01 — Autenticação Web
**Objetivo:** representar o login de usuários no aplicativo web via NextAuth.
**Descrição (para o documento):** O usuário informa e-mail e senha na tela `/login`. O NextAuth, configurado com o provedor *Credentials*, delega a verificação à função `authenticateUserByCredentials`, que busca o usuário no banco (com seu papel), confirma que a conta está **ativa** e compara a senha com o hash `bcrypt`. Sendo válida, o NextAuth gera um **token de sessão JWT** contendo o papel do usuário e o redireciona para a área correspondente (`/dashboard`, `/empresa` ou `/admin`); caso contrário, retorna erro de credenciais. *Arquivos:* `src/lib/auth.ts`, `src/lib/mobile-auth.ts`.

## SEQ-02 — Autenticação Mobile (login + refresh)
**Objetivo:** mostrar a emissão e renovação de tokens no app mobile.
**Descrição:** Diferente do web (baseado em cookie), o app mobile usa tokens JWT próprios assinados com `jose` (HS256). No login, o endpoint `/api/auth/mobile/login` valida as credenciais e emite um **access token** (15 min) e um **refresh token** (30 dias), armazenados com segurança via `expo-secure-store`. Quando o access token expira, o app chama `/api/auth/mobile/refresh` com o refresh token; o servidor o verifica, confirma que o usuário está ativo e **não é admin** (perfil administrativo é bloqueado no mobile) e emite um novo par de tokens. *Arquivo:* `src/lib/mobile-auth.ts`.

## SEQ-03 — Cadastro de Usuário/Empresa
**Objetivo:** descrever o registro de novas contas.
**Descrição:** A partir da tela `/register`, os dados são validados pelo `registerSchema` (Zod). O servidor verifica se o e-mail já existe (retornando `409` se sim), resolve o papel pelo campo `tipo` e gera o hash `bcrypt` (custo 12) da senha. A criação ocorre em **transação**: cria-se o `User` e, quando o tipo é `empresa`, valida-se o CNPJ (obrigatório e único) e cria-se a `Company` vinculada. Em sucesso, retorna `201` com o id. *Arquivo:* `src/app/api/auth/register/route.ts`.

## SEQ-04 — Recuperação de Senha
**Objetivo:** detalhar o fluxo seguro de redefinição de senha em duas etapas.
**Descrição:** Em `/forgot-password`, o usuário informa o e-mail; se a conta existir, gera-se um token aleatório de 32 bytes, **armazena-se apenas o hash SHA-256** com validade de 1 hora, e devolve-se um `resetLink`. A resposta é sempre genérica, evitando enumeração de e-mails. Em `/reset-password`, o usuário envia token, e-mail e nova senha; o servidor valida a força da senha, recalcula o hash do token, confere igualdade e expiração e, se válido, grava a nova senha (`bcrypt`) e **invalida o token**. *Arquivos:* `forgot-password/route.ts`, `reset-password/route.ts`.

## SEQ-05 — Criar Solicitação (com upload)
**Objetivo:** mostrar a criação de uma solicitação de coleta com imagens.
**Descrição:** As imagens são enviadas **diretamente** ao Cloudinary pelo navegador (preset *unsigned*), que retorna URLs seguras. O formulário então chama `POST /api/solicitacoes`, protegido pelo `route-guard` (apenas `usuario`). O corpo é validado pelo `solicitacaoCreateSchema` (incluindo o limite de 5 imagens) e o `criarSolicitacao` persiste a solicitação com status `pendente` e `aprovado=false`, gravando as imagens associadas. Retorna `201`. *Arquivo:* `src/services/solicitacao.service.ts`.

## SEQ-06 — Listar Solicitações (ramificação por perfil)
**Objetivo:** evidenciar como o mesmo endpoint serve aos três perfis com regras distintas.
**Descrição:** O `GET /api/solicitacoes` autoriza os três papéis e ramifica internamente: o **cidadão** vê apenas as próprias solicitações; o **admin** vê o escopo de moderação (rejeitadas, aprovadas-sem-coleta e pendentes há mais de 24h); a **empresa** vê apenas as aprovadas e ainda sem coleta. Para admin e empresa, o *privacy mapper* mascara dados de contato e reduz o endereço a uma "região aproximada". *Arquivos:* `api/solicitacoes/route.ts`, `lib/privacy.ts`.

## SEQ-07 — Moderar Solicitação
**Objetivo:** representar a aprovação/rejeição pelo administrador.
**Descrição:** O admin envia `PATCH /api/admin/solicitacoes/[id]` com o campo `aprovado`. O `atualizarStatusSolicitacao` define o status como `aprovada` ou `rejeitada` e dispara uma notificação ao cidadão. A notificação é *best-effort*: uma eventual falha é registrada em log e ignorada, sem interromper a moderação. *Arquivo:* `src/services/solicitacao.service.ts`.

## SEQ-08 — Cancelar Solicitação
**Objetivo:** descrever o cancelamento pelo próprio cidadão e suas regras de estado.
**Descrição:** Via `PATCH /api/solicitacoes/[id]` com `{action:"cancelar"}`, o `cancelarSolicitacao` executa em transação: carrega a solicitação (validando posse), recusa o cancelamento se já estiver `rejeitada`/`cancelada` ou se a coleta estiver em estágio avançado (`em_coleta`/`concluida`). Se houver coleta em `aceita`/`a_caminho`, ela também é cancelada. Por fim, marca a solicitação como `cancelada`. *Arquivo:* `src/services/solicitacao.service.ts`.

## SEQ-09 — Negociar (chat pré-aceite)
**Objetivo:** mostrar a conversa entre empresa e cidadão antes do aceite.
**Descrição:** A empresa abre (ou reutiliza) uma `ConversaSolicitacao` por solicitação via *upsert* (status `aberta`). Ao enviar mensagem, o `enviarMensagemConversaSolicitacao` normaliza o texto (máx. 1000 caracteres), verifica a autorização do remetente, e recusa o envio se a conversa não estiver `aberta` ou se a solicitação já tiver sido aceita. Persistida a `MensagemPreAceite`, o outro participante é notificado. *Arquivo:* `src/services/conversa-solicitacao.service.ts`.

## SEQ-10 — Aceitar Solicitação (cria Coleta)
**Objetivo:** representar o fluxo principal de negócio, com garantia de exclusividade.
**Descrição:** A empresa envia `POST /api/empresa/coletas`. Em **transação atômica**, o `aceitarSolicitacao` confirma que a solicitação está aprovada e ainda sem coleta, gera um código de confirmação (8 caracteres hex) e cria a `Coleta` com status `aceita`. Em seguida, marca a conversa da empresa vencedora como `convertida` e as das demais como `encerrada`. Concluída a transação, notifica o cidadão. Se a solicitação já tiver sido aceita, lança erro e retorna `400`. *Arquivo:* `src/services/coleta.service.ts`.

## SEQ-11 — Atualizar/Concluir Coleta
**Objetivo:** descrever o avanço do ciclo de vida da coleta.
**Descrição:** Via `PATCH /api/empresa/coletas/[id]`, o `coletaStatusSchema` valida o novo status. O `atualizarStatusColeta` confirma que a coleta pertence à empresa autenticada e atualiza o status; ao concluir, grava `dataConclusao`. O cidadão é notificado a cada mudança. *Arquivo:* `src/services/coleta.service.ts`.

## SEQ-12 — Conversar na Coleta
**Objetivo:** mostrar o chat operacional vinculado a uma coleta já aceita.
**Descrição:** Em `POST /api/mensagens/[coletaId]`, o `enviarMensagem` chama `verificarAcessoColeta` para garantir que o remetente é o dono da solicitação **ou** o usuário da empresa responsável. Autorizado, grava a `Mensagem` e notifica o outro participante. *Arquivo:* `src/services/mensagem.service.ts`.

## SEQ-13 — Avaliar Coleta
**Objetivo:** representar a avaliação reputacional pós-coleta.
**Descrição:** Em `POST /api/avaliacoes`, valida-se a nota (1–5) e o comentário (≤ 500). O `criarAvaliacao` carrega a coleta e exige três condições: o autor é o dono da solicitação, a coleta está `concluida` e ainda não foi avaliada (`coletaId` é único). Atendidas, cria a `Avaliacao` e notifica a empresa. *Arquivo:* `src/services/avaliacao.service.ts`.

## SEQ-14 — Notificações em Tempo Real (SSE)
**Objetivo:** detalhar o canal de notificações.
**Descrição:** O componente `NotificationBell` abre um `EventSource` para `/api/notificacoes/stream` (autenticado por cookie). O servidor envia um evento `init` com o contador de não lidas e, a cada 4 segundos, consulta notificações novas, emitindo eventos `notificacoes`. Um *heartbeat* mantém a conexão; ao atingir o limite de 60s, o navegador reconecta automaticamente usando `Last-Event-ID`. *Arquivos:* `api/notificacoes/stream/route.ts`, `notificacao.service.ts`.

## SEQ-15 — Consultar CEP
**Objetivo:** mostrar a integração com serviço externo de endereço.
**Descrição:** O endpoint `GET /api/cep/[cep]` normaliza o CEP (8 dígitos) e consulta a API pública **ViaCEP**. Em sucesso, devolve rua, bairro, cidade e UF, preenchendo automaticamente o formulário; trata CEP inválido (`400`), não encontrado (`404`) e indisponibilidade (`502`/`500`). *Arquivo:* `src/app/api/cep/[cep]/route.ts`.
