# Dicionário de Dados — ECOnecta

Dicionário completo das **12 tabelas** do banco (PostgreSQL), conforme `prisma/schema.prisma`.
Mapeamento de tipos: `Int → integer/serial`, `String → text`, `Boolean → boolean`, `DateTime → timestamp`.

> **Atualizado** em relação ao APÊNDICE G original, que cobria apenas 8 tabelas. Foram acrescentadas
> `avaliacoes`, `conversas_solicitacao`, `mensagens_pre_aceite` e `notificacoes`.

---

## Tabela: `roles`
Perfis de acesso do sistema.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da role |
| nome | String | Não | — | — | Nome do perfil (`usuario`, `admin`, `empresa`) |

## Tabela: `users`
Usuários do sistema (cidadãos, administradores e responsáveis por empresas).

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador do usuário |
| nome | String | Não | — | — | Nome completo |
| endereco | String | Sim | — | — | Endereço do usuário |
| telefone | String | Sim | — | — | Telefone de contato |
| email | String | Não | UK | — | E-mail de login (único) |
| senhaHash | String | Não | — | — | Hash bcrypt da senha (12 rounds) |
| status | String | Não | — | `ativo` | Situação da conta (`ativo` / `inativo`) |
| roleId | Int | Não | FK → roles.id | — | Perfil de acesso |
| createdAt | DateTime | Não | — | now() | Data de cadastro |
| resetToken | String | Sim | UK | — | Hash SHA-256 do token de redefinição de senha |
| resetTokenExpiry | DateTime | Sim | — | — | Validade do token de redefinição (1 hora) |

## Tabela: `companies`
Dados das empresas coletoras, vinculadas 1:1 a um usuário.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da empresa |
| userId | Int | Não | FK → users.id, UK | — | Usuário responsável (único) |
| cnpj | String | Não | UK | — | CNPJ da empresa (único) |
| descricao | String | Sim | — | — | Descrição/atuação da empresa |
| createdAt | DateTime | Não | — | now() | Data de cadastro |

## Tabela: `material_tipos`
Tipos de material recicláveis aceitos.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador do tipo de material |
| nome | String | Não | — | — | Nome do material (ex.: Papel/Papelão, Plástico, Vidro) |

## Tabela: `solicitacao_coleta`
Solicitações de coleta criadas pelos cidadãos.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da solicitação |
| titulo | String | Não | — | — | Título (mín. 3 caracteres) |
| descricao | String | Não | — | — | Descrição (mín. 10 caracteres) |
| quantidade | String | Não | — | — | Quantidade estimada do material |
| endereco | String | Não | — | — | Endereço da coleta (mín. 5 caracteres) |
| status | String | Não | — | `pendente` | `pendente` / `aprovada` / `rejeitada` / `cancelada` |
| aprovado | Boolean | Não | — | false | Indica se foi aprovada pelo administrador |
| userId | Int | Não | FK → users.id | — | Cidadão solicitante |
| materialId | Int | Não | FK → material_tipos.id | — | Tipo de material |
| createdAt | DateTime | Não | — | now() | Data de criação |

## Tabela: `solicitacao_imagens`
Imagens anexadas a uma solicitação (máx. 5 por solicitação — regra de negócio).

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da imagem |
| solicitacaoId | Int | Não | FK → solicitacao_coleta.id | — | Solicitação relacionada |
| url | String | Não | — | — | URL da imagem (Cloudinary) |

## Tabela: `coletas`
Coletas resultantes do aceite de uma solicitação aprovada.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da coleta |
| solicitacaoId | Int | Não | FK → solicitacao_coleta.id, UK | — | Solicitação atendida (única) |
| companyId | Int | Não | FK → companies.id | — | Empresa responsável |
| status | String | Não | — | `aceita` | `aceita` / `a_caminho` / `em_coleta` / `concluida` / `cancelada` |
| codigoConfirmacao | String | Sim | — | — | Código (hex, 8 caracteres) gerado no aceite |
| dataAceite | DateTime | Não | — | now() | Data do aceite |
| dataPrevisaoColeta | DateTime | Sim | — | — | Previsão informada pela empresa |
| dataConclusao | DateTime | Sim | — | — | Data de conclusão da coleta |

## Tabela: `avaliacoes`  *(nova)*
Avaliação reputacional de uma coleta concluída, feita pelo cidadão solicitante.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da avaliação |
| coletaId | Int | Não | FK → coletas.id, UK | — | Coleta avaliada (uma avaliação por coleta) |
| autorId | Int | Não | FK → users.id | — | Cidadão autor da avaliação |
| nota | Int | Não | — | — | Nota de 1 a 5 |
| comentario | String | Sim | — | — | Comentário opcional (máx. 500 caracteres) |
| createdAt | DateTime | Não | — | now() | Data da avaliação |

## Tabela: `mensagens`
Mensagens trocadas entre cidadão e empresa no contexto de uma **coleta** (pós-aceite).

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da mensagem |
| coletaId | Int | Não | FK → coletas.id | — | Coleta à qual a mensagem pertence |
| remetenteId | Int | Não | FK → users.id | — | Usuário que enviou a mensagem |
| mensagem | String | Não | — | — | Conteúdo (não vazio, máx. 1000 caracteres) |
| createdAt | DateTime | Não | — | now() | Data/hora do envio |

## Tabela: `conversas_solicitacao`  *(nova)*
Conversa de negociação **antes do aceite**, entre uma empresa e o cidadão de uma solicitação.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da conversa |
| solicitacaoId | Int | Não | FK → solicitacao_coleta.id | — | Solicitação em negociação |
| companyId | Int | Não | FK → companies.id | — | Empresa interessada |
| status | String | Não | — | `aberta` | `aberta` / `convertida` / `encerrada` |
| createdAt | DateTime | Não | — | now() | Data de criação |
| updatedAt | DateTime | Não | — | @updatedAt | Última atualização |

> **Restrição:** `UNIQUE(solicitacaoId, companyId)` — uma conversa por par solicitação/empresa.

## Tabela: `mensagens_pre_aceite`  *(nova)*
Mensagens trocadas dentro de uma `conversa_solicitacao` (negociação pré-aceite).

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da mensagem |
| conversaId | Int | Não | FK → conversas_solicitacao.id | — | Conversa à qual pertence |
| remetenteId | Int | Não | FK → users.id | — | Usuário que enviou |
| mensagem | String | Não | — | — | Conteúdo (não vazio, máx. 1000 caracteres) |
| createdAt | DateTime | Não | — | now() | Data/hora do envio |

## Tabela: `notificacoes`  *(nova)*
Notificações dos usuários, consumidas em tempo real via SSE.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da notificação |
| userId | Int | Não | FK → users.id | — | Destinatário |
| tipo | String | Não | — | — | Tipo do evento (ver enumerações) |
| titulo | String | Não | — | — | Título curto |
| descricao | String | Não | — | — | Texto da notificação |
| href | String | Sim | — | — | Link de destino ao clicar |
| lida | Boolean | Não | — | false | Indica se já foi lida |
| createdAt | DateTime | Não | — | now() | Data de criação |

> **Índices:** `(userId, lida)` e `(userId, id)` — otimizam o contador de não lidas e o stream SSE.

---

## Domínios de valores (enumerações)

| Campo | Valores possíveis |
|-------|-------------------|
| `roles.nome` | `usuario`, `admin`, `empresa` |
| `users.status` | `ativo`, `inativo` |
| `solicitacao_coleta.status` | `pendente`, `aprovada`, `rejeitada`, `cancelada` |
| `coletas.status` | `aceita`, `a_caminho`, `em_coleta`, `concluida`, `cancelada` |
| `conversas_solicitacao.status` | `aberta`, `convertida`, `encerrada` |
| `notificacoes.tipo` | `solicitacao_aprovada`, `solicitacao_rejeitada`, `coleta_aceita`, `coleta_status`, `nova_mensagem`, `avaliacao_recebida` |
| `avaliacoes.nota` | `1`, `2`, `3`, `4`, `5` |

## Observações de integridade

- Os campos `status` e `tipo` são `String` na base (a consistência é garantida na aplicação via Zod e nos *services*), e **não** como `ENUM` do PostgreSQL.
- Não há `ON DELETE CASCADE` declarado nas migrations; a remoção de registros relacionados depende da camada de aplicação.
