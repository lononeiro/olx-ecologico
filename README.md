# ♻️ Sistema de Reciclagem — Gerenciamento de Coletas

Plataforma web que conecta **cidadãos**, **empresas coletoras** e **administradores** para facilitar o processo de solicitação e coleta de materiais recicláveis.

---

## 📋 Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Modelo de Dados](#modelo-de-dados)
- [Perfis de Usuário e Fluxo](#perfis-de-usuário-e-fluxo)
- [Rotas da Aplicação](#rotas-da-aplicação)
- [API Endpoints](#api-endpoints)
- [Stack Tecnológico](#stack-tecnológico)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Inicialização](#instalação-e-inicialização)
- [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## Visão Geral

O sistema permite que cidadãos cadastrem solicitações de coleta de materiais recicláveis com fotos e endereço. Um **admin** aprova ou rejeita as solicitações. Após aprovação, **empresas coletoras** visualizam as solicitações disponíveis, aceitam a coleta e atualizam o status em tempo real até a conclusão. Cidadãos e empresas também se comunicam via **chat** dentro de cada coleta.

---

## Arquitetura

```
recycling-system/
│
├── prisma/
│   ├── schema.prisma          # Modelos do banco de dados
│   ├── seed.ts                # Script de dados iniciais
│   └── migrations/            # Histórico de migrações SQL
│
├── public/
│   └── icon/                  # Assets estáticos
│
└── src/
    ├── app/                   # Next.js App Router
    │   ├── (auth)/            # Grupo de rotas públicas (sem Navbar)
    │   │   ├── login/
    │   │   └── register/
    │   │
    │   ├── api/               # API Routes (backend)
    │   │   ├── auth/          # Registro, login, reset de senha
    │   │   ├── solicitacoes/  # CRUD de solicitações (usuário)
    │   │   ├── empresa/       # Coletas (empresa)
    │   │   │   └── coletas/
    │   │   ├── admin/         # Aprovação de solicitações (admin)
    │   │   ├── materiais/     # Tipos de materiais
    │   │   ├── mensagens/     # Chat por coleta
    │   │   ├── users/me/      # Perfil do usuário
    │   │   └── route.ts       # Documentação da API (HTML/JSON)
    │   │
    │   ├── dashboard/         # Área do Cidadão
    │   │   └── solicitacoes/
    │   │       ├── nova/      # Criar solicitação
    │   │       └── [id]/      # Detalhe / chat
    │   │
    │   ├── empresa/           # Área da Empresa Coletora
    │   │   ├── coletas/       # Minhas coletas
    │   │   │   └── [id]/      # Detalhe / atualizar status
    │   │   └── solicitacoes/  # Solicitações disponíveis para aceitar
    │   │
    │   ├── admin/             # Área do Administrador
    │   │   └── solicitacoes/  # Fila de aprovação
    │   │       └── [id]/
    │   │
    │   ├── me/                # Página de perfil do usuário logado
    │   └── page.tsx           # Landing page pública
    │
    ├── components/
    │   ├── cards/             # SolicitacaoCard, SolicitacaoCardVisual
    │   ├── forms/             # ChatBox
    │   └── ui/                # Navbar, MapaEndereco, StatusBadge,
    │                          #   ColetaStatusTracker, ThemeToggle, etc.
    │
    ├── lib/
    │   ├── auth.ts            # Configuração NextAuth (JWT + Credentials)
    │   ├── prisma.ts          # Singleton do Prisma Client
    │   ├── route-guard.ts     # Helper de proteção de rotas
    │   ├── validations.ts     # Schemas Zod de validação
    │   └── swagger.ts         # Configuração Swagger
    │
    ├── services/              # Camada de acesso a dados
    │   ├── solicitacao.service.ts
    │   ├── coleta.service.ts
    │   └── mensagem.service.ts
    │
    ├── types/
    │   └── index.ts           # Tipos TypeScript e constantes de status
    │
    └── middleware.ts          # Proteção e redirecionamento de rotas por role
```

### Decisões de Arquitetura

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, API Routes e roteamento integrados |
| Autenticação | NextAuth.js com JWT | Suporte a roles no token, sem estado no servidor |
| Banco de dados | PostgreSQL (Neon) | Relacional, gerenciado, com suporte a Prisma |
| ORM | Prisma | Type-safety, migrations e seed integrados |
| Upload de imagens | Cloudinary | CDN e transformação de imagens sem armazenamento local |
| Mapa | Leaflet | Mapa open-source para exibir endereços de coleta |
| Validação | Zod | Validação compartilhada entre cliente e servidor |
| Estilização | Tailwind CSS | Utilitário, sem CSS customizado verboso |

---

## Modelo de Dados

```
Role ──────────────── User
                       │
             ┌─────────┼─────────┐
             │         │         │
          Company  Solicitacao  Mensagem
             │      Coleta
             │         │
          Coleta ──────┘
             │
          Mensagem
```

### Entidades principais

- **User** — Cidadão, empresa ou admin. Tem `roleId`, `status` (ativo/inativo) e suporte a reset de senha por token.
- **Company** — Perfil extra de usuários com role `empresa`, com CNPJ.
- **SolicitacaoColeta** — Pedido de coleta criado pelo cidadão. Passa pelos status `pendente → aprovada/rejeitada`.
- **SolicitacaoImagem** — Imagens (URLs Cloudinary) vinculadas a uma solicitação (máx. 5).
- **Coleta** — Criada quando uma empresa aceita uma solicitação. Tem status próprio: `aceita → a_caminho → em_coleta → concluida/cancelada`. Gera um `codigoConfirmacao`.
- **Mensagem** — Chat entre cidadão e empresa dentro de uma coleta.
- **MaterialTipo** — Tipos de material recicláveis (ex: papel, plástico, metal).

---

## Perfis de Usuário e Fluxo

### Cidadão (`usuario`)
1. Cria uma solicitação de coleta com título, descrição, material, quantidade, endereço e até 5 fotos.
2. Aguarda aprovação do admin.
3. Após aprovação, acompanha o status da coleta e conversa com a empresa via chat.

### Administrador (`admin`)
1. Visualiza todas as solicitações pendentes.
2. Aprova ou rejeita cada uma.
3. Após aprovação, a solicitação fica disponível para empresas.

### Empresa (`empresa`)
1. Visualiza solicitações aprovadas e disponíveis.
2. Aceita uma solicitação, criando uma coleta.
3. Atualiza o status da coleta conforme o andamento.
4. Se comunica com o cidadão via chat.

---

## Rotas da Aplicação

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | Público | Landing page |
| `/login` | Público | Login |
| `/register` | Público | Cadastro |
| `/dashboard` | `usuario` | Painel do cidadão |
| `/dashboard/solicitacoes` | `usuario` | Minhas solicitações |
| `/dashboard/solicitacoes/nova` | `usuario` | Nova solicitação |
| `/dashboard/solicitacoes/[id]` | `usuario` | Detalhe + chat |
| `/empresa` | `empresa` | Painel da empresa |
| `/empresa/solicitacoes` | `empresa` | Solicitações disponíveis |
| `/empresa/coletas` | `empresa` | Minhas coletas |
| `/empresa/coletas/[id]` | `empresa` | Detalhe + atualizar status |
| `/admin` | `admin` | Painel administrativo |
| `/admin/solicitacoes` | `admin` | Fila de aprovação |
| `/me` | Autenticado | Perfil do usuário |
| `/api` | Público | Documentação da API |

---

## API Endpoints

| Método | Endpoint | Role | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Registrar usuário |
| `POST` | `/api/auth/forgot-password` | — | Solicitar reset de senha |
| `POST` | `/api/auth/reset-password` | — | Redefinir senha |
| `GET` | `/api/materiais` | — | Listar tipos de material |
| `GET` | `/api/solicitacoes` | Autenticado | Listar solicitações do usuário |
| `POST` | `/api/solicitacoes` | `usuario` | Criar solicitação |
| `GET` | `/api/solicitacoes/[id]` | Autenticado | Detalhe de solicitação |
| `PATCH` | `/api/admin/solicitacoes/[id]` | `admin` | Aprovar ou rejeitar |
| `GET` | `/api/empresa/coletas` | `empresa` | Coletas da empresa |
| `POST` | `/api/empresa/coletas` | `empresa` | Aceitar solicitação |
| `GET` | `/api/empresa/coletas/[id]` | `empresa`/`usuario` | Detalhe da coleta |
| `PATCH` | `/api/empresa/coletas/[id]` | `empresa` | Atualizar status da coleta |
| `GET` | `/api/mensagens/[id]` | `usuario`/`empresa` | Mensagens da coleta |
| `POST` | `/api/mensagens/[id]` | `usuario`/`empresa` | Enviar mensagem |
| `GET` | `/api/users/me` | Autenticado | Dados do perfil |

A documentação interativa da API está disponível em `http://localhost:3000/api`.

---

## Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript 5 |
| Autenticação | NextAuth.js 4 + JWT |
| Banco de Dados | PostgreSQL (Neon serverless) |
| ORM | Prisma 5 |
| Estilização | Tailwind CSS 3 |
| Upload de Imagens | Cloudinary (next-cloudinary) |
| Mapa | Leaflet 1.9 |
| Validação | Zod 3 |
| Senhas | bcryptjs |

---

## Pré-requisitos

- **Node.js** 18.17 ou superior
- **npm** 9+ (ou yarn/pnpm)
- Conta no **Neon** (ou outro PostgreSQL acessível) → para `DATABASE_URL`
- Conta no **Cloudinary** → para upload de imagens

---

## Instalação e Inicialização

### 1. Clone o repositório e instale as dependências

```bash
git clone <url-do-repositorio>
cd recycling-system
npm install
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais (veja a seção [Variáveis de Ambiente](#variáveis-de-ambiente)).

### 3. Configure o banco de dados

Execute as migrações para criar as tabelas:

```bash
npm run db:migrate
```

Ou, se preferir aplicar o schema sem histórico de migrations (ex: banco novo):

```bash
npm run db:push
```

### 4. Popule o banco com dados iniciais (opcional, mas recomendado)

```bash
npm run db:seed
```

O seed cria os tipos de material, as roles (`usuario`, `empresa`, `admin`) e usuários de teste.

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse em **http://localhost:3000**.

---

## Scripts Disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (inclui `prisma generate`) |
| `npm run start` | Inicia o servidor em modo produção |
| `npm run lint` | Linting com ESLint |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Cria e aplica uma nova migration |
| `npm run db:push` | Aplica o schema sem criar migration |
| `npm run db:seed` | Popula o banco com dados iniciais |
| `npm run db:studio` | Abre o Prisma Studio (GUI do banco) |

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Banco de dados PostgreSQL (ex: Neon)
DATABASE_URL="postgresql://usuario:senha@host/banco?sslmode=require"

# NextAuth — gere um segredo com: openssl rand -base64 32
NEXTAUTH_SECRET="seu-segredo-forte-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary — upload de imagens
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="seu-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="seu-upload-preset"
```

### Como obter cada valor

- **DATABASE_URL** — Crie um projeto gratuito em [neon.tech](https://neon.tech) e copie a connection string.
- **NEXTAUTH_SECRET** — Gere com `openssl rand -base64 32` no terminal.
- **NEXTAUTH_URL** — `http://localhost:3000` para dev; URL do seu domínio em produção.
- **NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME** e **NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET** — Crie uma conta em [cloudinary.com](https://cloudinary.com), vá em *Settings → Upload → Upload presets* e crie um preset **unsigned**.

---

## Build para Produção

```bash
npm run build
npm run start
```

> O comando `build` já executa `prisma generate` automaticamente.