# APÊNDICE G — Dicionário de Dados

Dicionário de dados do **ECOnecta**, baseado em `prisma/schema.prisma`. Os tipos lógicos
correspondem ao mapeamento Prisma → PostgreSQL (`Int` → `integer/serial`, `String` → `text`,
`Boolean` → `boolean`, `DateTime` → `timestamp`).

---

## Tabela: `roles`
Perfis de acesso do sistema.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da role |
| nome | String | Não | — | — | Nome do perfil (`usuario`, `admin`, `empresa`) |

---

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

---

## Tabela: `companies`
Dados das empresas coletoras, vinculadas 1:1 a um usuário.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da empresa |
| userId | Int | Não | FK → users.id, UK | — | Usuário responsável (único) |
| cnpj | String | Não | UK | — | CNPJ da empresa (único) |
| descricao | String | Sim | — | — | Descrição/atuação da empresa |
| createdAt | DateTime | Não | — | now() | Data de cadastro |

---

## Tabela: `material_tipos`
Tipos de material recicláveis aceitos.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador do tipo de material |
| nome | String | Não | — | — | Nome do material (ex.: Papel/Papelão, Plástico, Vidro) |

---

## Tabela: `solicitacao_coleta`
Solicitações de coleta criadas pelos cidadãos.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da solicitação |
| titulo | String | Não | — | — | Título (mín. 3 caracteres) |
| descricao | String | Não | — | — | Descrição (mín. 10 caracteres) |
| quantidade | String | Não | — | — | Quantidade estimada do material |
| endereco | String | Não | — | — | Endereço da coleta (mín. 5 caracteres) |
| status | String | Não | — | `pendente` | `pendente` / `aprovada` / `rejeitada` |
| aprovado | Boolean | Não | — | false | Indica se foi aprovada pelo administrador |
| userId | Int | Não | FK → users.id | — | Cidadão solicitante |
| materialId | Int | Não | FK → material_tipos.id | — | Tipo de material |
| createdAt | DateTime | Não | — | now() | Data de criação |

---

## Tabela: `solicitacao_imagens`
Imagens anexadas a uma solicitação (máx. 5 por solicitação — regra de negócio).

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da imagem |
| solicitacaoId | Int | Não | FK → solicitacao_coleta.id | — | Solicitação relacionada |
| url | String | Não | — | — | URL da imagem (Cloudinary) |

---

## Tabela: `coletas`
Coletas resultantes do aceite de uma solicitação aprovada.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da coleta |
| solicitacaoId | Int | Não | FK → solicitacao_coleta.id, UK | — | Solicitação atendida (única) |
| companyId | Int | Não | FK → companies.id | — | Empresa responsável |
| status | String | Não | — | `aceita` | `aceita` / `a_caminho` / `em_coleta` / `concluida` / `cancelada` |
| codigoConfirmacao | String | Sim | — | — | Código (hex, 8 caracteres) para confirmar a conclusão |
| dataAceite | DateTime | Não | — | now() | Data do aceite |
| dataPrevisaoColeta | DateTime | Sim | — | — | Previsão informada pela empresa |
| dataConclusao | DateTime | Sim | — | — | Data de conclusão da coleta |

---

## Tabela: `mensagens`
Mensagens trocadas entre cidadão e empresa no contexto de uma coleta.

| Campo | Tipo | Nulo | Chave | Padrão | Descrição |
|-------|------|------|-------|--------|-----------|
| id | Int (serial) | Não | PK | autoincrement | Identificador da mensagem |
| coletaId | Int | Não | FK → coletas.id | — | Coleta à qual a mensagem pertence |
| remetenteId | Int | Não | FK → users.id | — | Usuário que enviou a mensagem |
| mensagem | String | Não | — | — | Conteúdo da mensagem (não vazio) |
| createdAt | DateTime | Não | — | now() | Data/hora do envio |

---

## Domínios de valores (enumerações)

| Campo | Valores possíveis |
|-------|-------------------|
| `roles.nome` | `usuario`, `admin`, `empresa` |
| `users.status` | `ativo`, `inativo` |
| `solicitacao_coleta.status` | `pendente`, `aprovada`, `rejeitada` |
| `coletas.status` | `aceita`, `a_caminho`, `em_coleta`, `concluida`, `cancelada` |
