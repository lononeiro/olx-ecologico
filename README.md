# ECOnecta

Plataforma web para conectar cidadaos, administradores e empresas coletoras no processo de solicitacao e coleta de materiais reciclaveis.

## Visao geral

O sistema permite que usuarios comuns criem solicitacoes com descricao, endereco e imagens do material. Um administrador analisa essas solicitacoes e, quando aprovadas, elas ficam disponiveis para empresas coletoras aceitarem a coleta, atualizarem o andamento e conversarem com o solicitante.

Perfis suportados:

- `usuario`
- `admin`
- `empresa`

## Funcionalidades principais

- autenticacao com NextAuth usando credenciais
- controle de acesso por role
- cadastro de usuario e empresa
- criacao de solicitacoes com ate 5 imagens via Cloudinary
- aprovacao e rejeicao de solicitacoes pelo admin
- aceite e acompanhamento de coletas pela empresa
- chat entre usuario e empresa dentro da coleta
- pagina `/me` para o usuario autenticado visualizar e editar o proprio perfil
- modo claro e modo escuro com persistencia

## Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth.js
- Zod
- next-cloudinary
- Leaflet

## Estrutura monorepo

O projeto agora esta preparado para evoluir em tres camadas:

```text
.
|- apps/
|  |- mobile/          # app Expo / React Native
|- packages/
|  |- shared/          # schemas, contratos e status compartilhados
|- prisma/             # banco e seed
|- src/                # app web atual em Next.js
```

### Como isso foi organizado

- o web atual continua na raiz para evitar uma migracao grande agora
- o mobile nasce em `apps/mobile`
- regras compartilhadas ficam em `packages/shared`
- o arquivo `src/lib/validations.ts` do web agora reaproveita o pacote compartilhado

### Scripts uteis

```bash
npm run dev:web
npm run dev:mobile
npm run typecheck:shared
```

### Observacao importante sobre auth mobile

Hoje o web usa NextAuth com sessao voltada ao navegador. Para o app mobile, a base ideal continua sendo:

- backend atual em Next.js
- novos endpoints de autenticacao para mobile
- access token + refresh token
- armazenamento seguro com `expo-secure-store`

O scaffold do mobile ja foi criado com isso em mente, mas a troca completa da autenticacao ainda e o proximo passo.

## Estrutura do projeto

```text
src/
|- app/
|  |- (auth)/
|  |- admin/
|  |- api/
|  |- dashboard/
|  |- empresa/
|  |- me/
|  |- layout.tsx
|  |- page.tsx
|- components/
|  |- cards/
|  |- forms/
|  |- ui/
|- lib/
|  |- auth.ts
|  |- prisma.ts
|  |- route-guard.ts
|  |- validations.ts
|- services/
|- types/
prisma/
|- schema.prisma
|- seed.ts
```

## Rotas principais

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/dashboard/solicitacoes`
- `/dashboard/solicitacoes/nova`
- `/dashboard/solicitacoes/[id]`
- `/admin`
- `/admin/solicitacoes`
- `/admin/solicitacoes/[id]`
- `/empresa`
- `/empresa/solicitacoes`
- `/empresa/coletas`
- `/empresa/coletas/[id]`
- `/me`

## Endpoints principais

### Autenticacao

- `POST /api/auth/register`
- `POST /api/auth/[...nextauth]`
- `POST /api/auth/mobile/login`
- `POST /api/auth/mobile/refresh`

### Usuario autenticado

- `GET /api/users/me`
- `PATCH /api/users/me`

### Solicitacoes

- `GET /api/solicitacoes`
- `POST /api/solicitacoes`
- `GET /api/solicitacoes/[id]`

### Admin

- `PATCH /api/admin/solicitacoes/[id]`

### Empresa / Coletas

- `GET /api/empresa/coletas`
- `POST /api/empresa/coletas`
- `GET /api/empresa/coletas/[id]`
- `PATCH /api/empresa/coletas/[id]`

### Mensagens

- `GET /api/mensagens/[id]`
- `POST /api/mensagens/[id]`

### Materiais

- `GET /api/materiais`

## Modelo de dados

Relacoes principais definidas no `prisma/schema.prisma`:

```text
Role -> User (1:N)
User -> Company (1:1)
User -> SolicitacaoColeta (1:N)
User -> Mensagem (1:N)
SolicitacaoColeta -> SolicitacaoImagem (1:N)
SolicitacaoColeta -> Coleta (1:1)
Company -> Coleta (1:N)
Coleta -> Mensagem (1:N)
```

## Fluxo de status

```text
Solicitacao: pendente -> aprovada | rejeitada
Coleta:      aceita -> a_caminho -> em_coleta -> concluida
                                          -> cancelada
```

## Configuracao local

### 1. Instale as dependencias

```bash
npm install
```

### 2. Configure as variaveis de ambiente

O projeto ja possui um arquivo `.env.example` com a estrutura esperada.

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Depois preencha o `.env` com os valores corretos para o seu ambiente.

Variaveis usadas atualmente:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require&channel_binding=require"
NEXTAUTH_SECRET="gere-um-segredo-forte-aqui"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="seu-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="seu-upload-preset"
```

### 3. Configure o banco

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Rode o projeto

```bash
npm run dev
```

Aplicacao disponivel em `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
npm run db:studio
```

## Perfil `/me`

A pagina `/me` usa sempre o usuario autenticado da sessao atual.

Dados exibidos:

- id
- nome
- email
- telefone
- endereco
- status
- data de cadastro
- role
- empresa vinculada, quando existir

Campos editaveis:

- nome
- telefone
- endereco

## Tema

O projeto suporta tema claro e escuro com persistencia no navegador:

- chave usada: `theme`
- valores: `light` e `dark`
- estrategia: classe `dark` aplicada no elemento `html`

## Upload de imagens

O cadastro de solicitacao suporta:

- selecao multipla
- ate 5 imagens por solicitacao
- preview antes do envio
- remocao individual
- upload via Cloudinary

## Seguranca

- hash de senha com `bcryptjs`
- sessao JWT com NextAuth
- autorizacao por role em rotas protegidas
- validacao com Zod
- atualizacao de dados sensiveis protegida no backend

## Seed

Os dados iniciais sao criados por `prisma/seed.ts`.

Para verificar usuarios de teste e dados populados, consulte diretamente esse arquivo.
