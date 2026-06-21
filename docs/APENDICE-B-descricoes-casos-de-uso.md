# APÊNDICE B — Descrições de Casos de Uso

Descrição detalhada dos principais casos de uso do **ECOnecta**. As regras descritas refletem as
validações (`packages/shared/src/validations.ts`), os serviços (`src/services`) e as rotas de API
(`src/app/api`) do sistema.

---

## UC01 — Cadastrar-se

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Cidadão ou Empresa Coletora |
| **Objetivo** | Criar uma conta de acesso ao sistema |
| **Pré-condições** | O e-mail não pode estar cadastrado |
| **Pós-condições** | Usuário criado com `status = ativo`; se for empresa, registro em `companies` |

**Fluxo principal**
1. O ator acessa `/register` e escolhe o tipo (`usuario` ou `empresa`).
2. Informa nome, e-mail, senha (mín. 6 caracteres) e, opcionalmente, endereço e telefone.
3. Sendo empresa, informa o CNPJ (obrigatório) e descrição (opcional).
4. O sistema valida os dados (Zod), normaliza o e-mail e verifica duplicidade.
5. A senha é cifrada com bcrypt (12 rounds) e o usuário é persistido.
6. Para empresa, o CNPJ é validado quanto à duplicidade e a empresa é criada na mesma transação.
7. O sistema retorna sucesso (HTTP 201).

**Fluxos alternativos / exceção**
- **A1 — E-mail já cadastrado:** retorna HTTP 409.
- **A2 — CNPJ já cadastrado:** a transação é revertida e retorna erro.
- **A3 — Dados inválidos:** retorna HTTP 400 com os erros por campo.

---

## UC02 — Autenticar (Login)

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Cidadão, Empresa ou Administrador |
| **Objetivo** | Iniciar sessão autenticada |
| **Pré-condições** | Conta existente e ativa |
| **Pós-condições** | Sessão JWT (web/NextAuth) ou access/refresh token (mobile) emitidos |

**Fluxo principal**
1. O ator informa e-mail e senha em `/login`.
2. O sistema localiza o usuário pelo e-mail e compara a senha com o hash (bcrypt).
3. Em caso de sucesso, gera a sessão e redireciona conforme a `role`
   (`/dashboard`, `/empresa` ou `/admin`).

**Fluxo alternativo**
- **A1 — Credenciais inválidas:** exibe mensagem de erro e mantém na tela de login.

---

## UC03 — Recuperar senha

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Cidadão ou Empresa |
| **Objetivo** | Redefinir a senha esquecida |
| **Pré-condições** | — |
| **Pós-condições** | `resetToken` e `resetTokenExpiry` gravados; senha redefinida no reset |

**Fluxo principal**
1. O ator informa o e-mail em `/forgot-password`.
2. O sistema gera um token aleatório, grava o hash SHA-256 e a validade (1 hora) no usuário.
3. Um link de redefinição é gerado (`/reset-password?token=...&email=...`).
4. O ator abre o link, informa a nova senha e confirma.
5. O sistema valida o token (hash e validade), cifra a nova senha e limpa o token.

**Fluxo alternativo**
- **A1 — E-mail inexistente:** retorna mensagem genérica de sucesso (evita enumeração de contas).
- **A2 — Token expirado/ inválido:** retorna erro e exige novo pedido.

---

## UC04 — Visualizar e editar perfil

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Cidadão ou Empresa |
| **Objetivo** | Consultar e atualizar dados pessoais |
| **Pré-condições** | Estar autenticado |
| **Pós-condições** | Dados de perfil atualizados |

**Fluxo principal**
1. O ator acessa `/me`.
2. O sistema exibe id, nome, e-mail, telefone, endereço, status, data de cadastro, role e empresa
   vinculada (quando houver).
3. O ator edita nome, telefone e/ou endereço e salva.
4. O sistema valida (nome ≥ 2 caracteres) e persiste as alterações.

> O e-mail e a `role` não são editáveis pelo próprio usuário.

---

## UC05 — Criar solicitação de coleta

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Cidadão |
| **Objetivo** | Registrar um material disponível para coleta |
| **Pré-condições** | Estar autenticado como `usuario` |
| **Pós-condições** | Solicitação criada com `status = pendente` e `aprovado = false` |

**Fluxo principal**
1. O ator acessa `/dashboard/solicitacoes/nova`.
2. Informa título (≥ 3), descrição (≥ 10), quantidade, endereço (≥ 5) e tipo de material.
3. Anexa de 0 a 5 imagens (UC06) via Cloudinary.
4. O sistema valida os dados, remove URLs duplicadas e cria a solicitação.

**Fluxos de exceção**
- **A1 — Mais de 5 imagens:** retorna erro de validação.
- **A2 — Campos inválidos:** retorna HTTP 400 com erros por campo.

---

## UC06 — Anexar imagens (incluído por UC05)

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Cidadão |
| **Objetivo** | Ilustrar o material da solicitação |
| **Regras** | Seleção múltipla; máximo de 5 imagens; preview e remoção individual; upload via Cloudinary |

---

## UC07 — Listar minhas solicitações

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Cidadão |
| **Objetivo** | Acompanhar as próprias solicitações |
| **Pré-condições** | Estar autenticado |
| **Pós-condições** | — (consulta) |

**Fluxo principal**
1. O ator acessa `/dashboard/solicitacoes`.
2. O sistema lista as solicitações do usuário, com material, imagens e coleta vinculada, ordenadas
   da mais recente para a mais antiga.

---

## UC08 — Acompanhar status da coleta

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Cidadão |
| **Objetivo** | Ver o andamento da coleta de uma solicitação aceita |
| **Pré-condições** | Solicitação aprovada e aceita por uma empresa |
| **Pós-condições** | — (consulta) |

**Fluxo principal**
1. O ator abre o detalhe da solicitação/coleta.
2. O sistema exibe o status (`aceita`, `a_caminho`, `em_coleta`, `concluida` ou `cancelada`), a
   empresa responsável, a previsão de coleta e o **código de confirmação**.

> O sistema só retorna a coleta se o solicitante for o dono — caso contrário, acesso negado.

---

## UC09 / UC15 — Conversar (chat da coleta)

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Cidadão (UC09) ou Empresa (UC15) |
| **Objetivo** | Trocar mensagens no contexto de uma coleta |
| **Pré-condições** | Existir uma coleta e o ator ser o dono da solicitação ou a empresa responsável |
| **Pós-condições** | Mensagem persistida e visível para ambos |

**Fluxo principal**
1. O ator abre o chat da coleta.
2. O sistema verifica o acesso (dono da solicitação **ou** usuário da empresa).
3. O ator digita e envia a mensagem (não vazia).
4. A mensagem é gravada com remetente e data/hora e exibida na conversa.

**Fluxo de exceção**
- **A1 — Sem permissão:** retorna "Acesso negado a esta conversa".

---

## UC10 — Ver solicitações aprovadas disponíveis

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Empresa Coletora |
| **Objetivo** | Listar oportunidades de coleta |
| **Pré-condições** | Estar autenticado como `empresa` |
| **Pós-condições** | — (consulta) |

**Fluxo principal**
1. O ator acessa `/empresa/solicitacoes`.
2. O sistema lista as solicitações com `status = aprovada`, `aprovado = true` e **sem coleta vinculada**.

---

## UC11 — Aceitar solicitação

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Empresa Coletora |
| **Objetivo** | Assumir a coleta de uma solicitação aprovada |
| **Pré-condições** | Solicitação aprovada e ainda não aceita |
| **Pós-condições** | Coleta criada com `status = aceita` e `codigoConfirmacao` gerado |

**Fluxo principal**
1. O ator seleciona uma solicitação disponível e a aceita (pode informar data de previsão).
2. O sistema verifica se a solicitação já não foi aceita por outra empresa.
3. Cria a coleta vinculando empresa e solicitação e gera um código de confirmação único.

**Fluxo de exceção**
- **A1 — Já aceita por outra empresa:** retorna "Solicitação já foi aceita por outra empresa".

---

## UC12 — Listar minhas coletas

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Empresa Coletora |
| **Objetivo** | Acompanhar as coletas assumidas |
| **Pré-condições** | Estar autenticado como `empresa` |

**Fluxo principal**
1. O ator acessa `/empresa/coletas`.
2. O sistema lista as coletas da empresa, com dados do solicitante, material e imagens, ordenadas
   pela data de aceite (mais recente primeiro).

---

## UC13 — Atualizar status da coleta

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Empresa Coletora |
| **Objetivo** | Avançar o andamento da coleta |
| **Pré-condições** | Ser a empresa responsável pela coleta |
| **Pós-condições** | Status atualizado |

**Fluxo principal**
1. O ator abre o detalhe da coleta em `/empresa/coletas/[id]`.
2. Seleciona o novo status: `a_caminho`, `em_coleta`, `concluida` ou `cancelada`.
3. O sistema valida a propriedade (empresa dona) e persiste o status.

---

## UC14 — Concluir coleta com código (estende UC13)

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Empresa Coletora |
| **Objetivo** | Encerrar a coleta confirmando a retirada |
| **Pré-condições** | Coleta em andamento; código de confirmação correto |
| **Pós-condições** | `status = concluida` e `dataConclusao` registrada |

**Fluxo principal**
1. No ato da coleta, o cidadão fornece o **código de confirmação**.
2. A empresa informa o código ao concluir a coleta.
3. O sistema compara o código (case-insensitive) com o gravado na coleta.
4. Confirmado, marca a coleta como `concluida` e registra a data de conclusão.

**Fluxos de exceção**
- **A1 — Código ausente:** retorna "Código de confirmação obrigatório para concluir".
- **A2 — Código inválido:** retorna "Código de confirmação inválido".

---

## UC16 — Visualizar dashboard (Admin)

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Administrador |
| **Objetivo** | Ter uma visão geral do sistema (métricas) |
| **Pré-condições** | Estar autenticado como `admin` |

**Fluxo principal**
1. O ator acessa `/admin`.
2. O sistema apresenta indicadores agregados (usuários, empresas, solicitações e coletas).

---

## UC17 / UC18 — Analisar e aprovar/rejeitar solicitações

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Administrador |
| **Objetivo** | Moderar as solicitações criadas pelos cidadãos |
| **Pré-condições** | Estar autenticado como `admin` |
| **Pós-condições** | Solicitação fica `aprovada` (`aprovado = true`) ou `rejeitada` |

**Fluxo principal**
1. O ator acessa `/admin/solicitacoes` e abre uma solicitação pendente (UC17).
2. Analisa título, descrição, material, imagens e dados do solicitante.
3. Decide **aprovar** ou **rejeitar** (UC18).
4. O sistema atualiza o status: aprovada (`aprovado = true`) ou rejeitada.

> Aprovada, a solicitação passa a ser listada para as empresas (UC10).

---

## UC19 — Gerenciar usuários (Admin)

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Administrador |
| **Objetivo** | Ativar/inativar e excluir usuários |
| **Pré-condições** | Estar autenticado como `admin` |

**Regras**
- Não é possível alterar o status de outro administrador.
- Não é possível excluir um administrador.
- Não é possível excluir um usuário que possua solicitações.

---

## UC20 — Gerenciar empresas (Admin)

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Administrador |
| **Objetivo** | Consultar e administrar as empresas cadastradas |
| **Pré-condições** | Estar autenticado como `admin` |

---

## UC21 — Gerenciar materiais (Admin)

| Campo | Descrição |
|-------|-----------|
| **Ator principal** | Administrador |
| **Objetivo** | Manter os tipos de material aceitos |
| **Pré-condições** | Estar autenticado como `admin` |
| **Pós-condições** | Tipo de material criado/alterado/removido |

**Regras**
- O nome é obrigatório.
- Não pode haver dois materiais com o mesmo nome (comparação *case-insensitive*).
