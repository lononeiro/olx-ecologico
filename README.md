# ECOnecta

Sistema web full-stack para gerenciamento de solicitacoes de coleta de reciclaveis, conectando cidadaos, administradores e empresas.

## Visao geral

O projeto foi construido com Next.js App Router, Prisma, NextAuth e PostgreSQL. A aplicacao possui tres perfis principais:

- `usuario`: cria solicitacoes, acompanha status, conversa com a empresa e gerencia o proprio perfil
- `admin`: aprova ou rejeita solicitacoes pendentes
- `empresa`: visualiza solicitacoes aprovadas, aceita coletas, atualiza o andamento e conversa com o solicitante

## Funcionalidades atuais

- autenticacao com NextAuth via credenciais
- autorizacao por role em rotas e endpoints
- cadastro de usuario e empresa
- criacao de solicitacao com upload de ate 5 imagens via Cloudinary
- visualizacao detalhada de solicitacoes com galeria ampliada
- fluxo de aprovacao administrativo
- aceite e acompanhamento operacional da coleta pela empresa
- chat entre usuario e empresa por coleta
- pagina `/me` para visualizar e editar o proprio perfil
- tema claro/escuro com persistencia em `localStorage`

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

## Estrutura principal

```text
src/
|- app/
|  |- (auth)/                  # login e cadastro
|  |- admin/                   # area administrativa
|  |- api/                     # endpoints REST
|  |- dashboard/               # area do usuario
|  |- empresa/                 # area da empresa
|  |- me/                      # meu perfil
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

## Modelo de dados

Relacoes principais definidas no `schema.prisma`:

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

## Fluxos de status

```text
Solicitacao: pendente -> aprovada | rejeitada
Coleta:      aceita -> a_caminho -> em_coleta -> concluida
                                          -> cancelada
```

## Rotas de interface

- `/`: landing page
- `/login`: autenticacao
- `/register`: cadastro
- `/dashboard`: painel do usuario
- `/dashboard/solicitacoes`: lista de solicitacoes do usuario
- `/dashboard/solicitacoes/nova`: nova solicitacao
- `/dashboard/solicitacoes/[id]`: detalhe da solicitacao
- `/admin`: painel do administrador
- `/admin/solicitacoes`: fila de aprovacao
- `/admin/solicitacoes/[id]`: detalhe para analise
- `/empresa`: painel da empresa
- `/empresa/solicitacoes`: solicitacoes aprovadas disponiveis
- `/empresa/coletas`: coletas aceitas
- `/empresa/coletas/[id]`: detalhe operacional da coleta
- `/me`: perfil do usuario autenticado

## Principais endpoints

### Autenticacao

- `POST /api/auth/register`
- `POST /api/auth/[...nextauth]`

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

## Perfil `/me`

A rota `/me` sempre usa o usuario autenticado da sessao atual.

Dados exibidos:

- `id`
- `nome`
- `email`
- `telefone`
- `endereco`
- `status`
- `createdAt`
- `role`
- `company`, quando houver relacao

Campos editaveis:

- `nome`
- `telefone`
- `endereco`

Campos sensiveis permanecem somente leitura.

## Tema claro/escuro

O projeto usa `darkMode: "class"` no Tailwind e aplica o tema no elemento `html`.

- chave salva: `theme`
- valores: `light` e `dark`
- comportamento: persistencia da escolha e reaplicacao automatica ao reabrir a aplicacao

## Upload de imagens

O cadastro de solicitacao suporta:

- selecao multipla
- ate 5 imagens por solicitacao
- preview antes do envio
- remocao individual
- upload via Cloudinary

## Requisitos

- Node.js 18+
- banco PostgreSQL

## Configuracao local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variaveis de ambiente

Crie um arquivo `.env` com os valores necessarios:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
NEXTAUTH_SECRET="seu-segredo"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="seu-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="seu-upload-preset"
```

Observacao: se o projeto usar outras variaveis locais no seu ambiente, mantenha-as tambem.

### 3. Prisma

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Desenvolvimento

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

## Seguranca

- senhas com hash via `bcryptjs`
- sessao JWT com NextAuth
- validacao com Zod
- autorizacao por role em endpoints protegidos
- usuario autenticado resolvido no backend pela sessao, sem confiar em ID vindo do front

## Seed

O projeto possui `prisma/seed.ts` para popular dados iniciais. Consulte esse arquivo para as credenciais e registros gerados no ambiente local.
