# ♻️ ReciclaFácil — Sistema de Coleta de Recicláveis

Sistema web full-stack para gerenciar solicitações de coleta de materiais recicláveis, conectando cidadãos, administradores e empresas de reciclagem.

---

## 📐 Arquitetura

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Rotas públicas (login, register)
│   ├── api/                    # API Routes (REST endpoints)
│   │   ├── auth/               # NextAuth + registro
│   │   ├── solicitacoes/       # CRUD de solicitações
│   │   ├── admin/              # Aprovação/rejeição (admin)
│   │   ├── empresa/coletas/    # Aceitar/atualizar coletas (empresa)
│   │   ├── mensagens/          # Chat por coleta
│   │   └── materiais/          # Listagem de tipos
│   ├── dashboard/              # Área do usuário comum
│   ├── admin/                  # Área do administrador
│   └── empresa/                # Área da empresa
├── components/
│   ├── cards/                  # SolicitacaoCard
│   ├── forms/                  # ChatBox
│   └── ui/                     # Navbar, StatusBadge
├── lib/                        # prisma.ts, auth.ts, validations.ts, route-guard.ts
├── services/                   # Lógica de negócio separada
│   ├── solicitacao.service.ts
│   ├── coleta.service.ts
│   └── mensagem.service.ts
└── types/                      # TypeScript types e constantes
```

### Papéis (Roles)

| Role      | Permissões |
|-----------|-----------|
| `usuario` | Criar/visualizar solicitações, trocar mensagens |
| `admin`   | Aprovar/rejeitar solicitações pendentes |
| `empresa` | Ver aprovadas, aceitar coletas, atualizar status, chat |

### Fluxo de Status

```
Solicitação:  pendente → [admin] → aprovada / rejeitada
Coleta:       aceita → a_caminho → em_coleta → concluida
                                              → cancelada
```

---

## 🚀 Configuração e Execução

### Pré-requisitos

- Node.js 18+
- Conta no [Neon](https://neon.tech) (PostgreSQL serverless gratuito) ou qualquer PostgreSQL

### 1. Clone e instale as dependências

```bash
git clone <repo-url>
cd recycling-system
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# String de conexão do Neon (ou outro PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Segredo para JWT do NextAuth — gere com:
# openssl rand -base64 32
NEXTAUTH_SECRET="seu-segredo-aqui"

# URL da aplicação
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Configure o banco de dados

```bash
# Gera o Prisma Client
npm run db:generate

# Aplica as migrations (cria as tabelas)
npm run db:migrate

# Popula o banco com dados iniciais
npm run db:seed
```

### 4. Execute o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🔑 Credenciais de Acesso (Seed)

| Tipo    | Email                   | Senha        |
|---------|-------------------------|--------------|
| Admin   | admin@recicla.com       | admin123     |
| Usuário | joao@example.com        | user123      |
| Empresa | empresa@recicla.com     | empresa123   |

---

## 📡 API Endpoints

### Autenticação
| Método | Rota                          | Descrição            | Acesso   |
|--------|-------------------------------|----------------------|----------|
| POST   | `/api/auth/register`          | Cadastro de usuário  | Público  |
| POST   | `/api/auth/[...nextauth]`     | Login/logout         | Público  |

### Solicitações
| Método | Rota                          | Descrição                        | Acesso            |
|--------|-------------------------------|----------------------------------|-------------------|
| GET    | `/api/solicitacoes`           | Lista (por role)                 | Autenticado       |
| POST   | `/api/solicitacoes`           | Cria solicitação                 | Usuário           |
| GET    | `/api/solicitacoes/:id`       | Detalhe                          | Autenticado       |

### Admin
| Método | Rota                              | Descrição              | Acesso |
|--------|-----------------------------------|------------------------|--------|
| PATCH  | `/api/admin/solicitacoes/:id`     | Aprovar/Rejeitar       | Admin  |

### Empresa / Coletas
| Método | Rota                          | Descrição                | Acesso  |
|--------|-------------------------------|--------------------------|---------|
| GET    | `/api/empresa/coletas`        | Lista coletas da empresa | Empresa |
| POST   | `/api/empresa/coletas`        | Aceitar solicitação      | Empresa |
| GET    | `/api/empresa/coletas/:id`    | Detalhe da coleta        | Empresa / Usuário |
| PATCH  | `/api/empresa/coletas/:id`    | Atualizar status         | Empresa |

### Mensagens
| Método | Rota                      | Descrição           | Acesso            |
|--------|---------------------------|---------------------|-------------------|
| GET    | `/api/mensagens/:coletaId`| Lista mensagens     | Autenticado       |
| POST   | `/api/mensagens/:coletaId`| Envia mensagem      | Usuário / Empresa |

### Materiais
| Método | Rota             | Descrição             | Acesso  |
|--------|------------------|-----------------------|---------|
| GET    | `/api/materiais` | Lista tipos           | Público |

---

## 🛡️ Segurança

- **Senhas** hashadas com `bcryptjs` (salt rounds: 12)
- **Autenticação** via JWT com NextAuth.js
- **Autorização** por role em cada endpoint via `route-guard.ts`
- **Middleware** de proteção de rotas (`/dashboard`, `/admin`, `/empresa`)
- **Validação de inputs** com Zod em todas as ações
- **Headers de segurança** configurados em `next.config.js` (X-Frame-Options, X-XSS-Protection, etc.)
- **CSRF**: protegido nativamente pelo Next.js App Router (Server Actions e API Routes com SameSite cookies)

---

## 🗃️ Schema do Banco de Dados

```prisma
Role → Users (1:N)
Users → Companies (1:1)
Users → SolicitacaoColeta (1:N)
SolicitacaoColeta → SolicitacaoImagens (1:N)
SolicitacaoColeta → Coletas (1:1)
Companies → Coletas (1:N)
Coletas → Mensagens (1:N)
```

---

## 🛠️ Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run db:generate  # Gera Prisma Client
npm run db:migrate   # Aplica migrations
npm run db:push      # Sincroniza schema sem migrations
npm run db:seed      # Popula dados iniciais
npm run db:studio    # Abre Prisma Studio (UI do banco)
```

---

## 📦 Tecnologias

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js    | 14     | Framework full-stack (App Router) |
| NextAuth.js | 4     | Autenticação e sessões |
| Prisma     | 5      | ORM para PostgreSQL |
| Neon DB    | —      | PostgreSQL serverless |
| Tailwind CSS | 3    | Estilização |
| Zod        | 3      | Validação de schemas |
| bcryptjs   | 2      | Hash de senhas |
| TypeScript | 5      | Tipagem estática |
