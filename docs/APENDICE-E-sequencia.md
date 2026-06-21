# APÊNDICE E — Diagrama de Sequência

Diagramas de sequência dos fluxos centrais do **ECOnecta**. Os participantes refletem a arquitetura
real: navegador → rotas de API (Next.js) → camada de serviço → Prisma/PostgreSQL.

> Cole cada bloco em <https://mermaid.live> ou visualize direto no GitHub/VS Code.

---

## E.1 — Criar solicitação de coleta (Cidadão)

```mermaid
sequenceDiagram
    actor Cidadao as Cidadão
    participant UI as Front-end (/dashboard)
    participant CDN as Cloudinary
    participant API as POST /api/solicitacoes
    participant Svc as solicitacao.service
    participant DB as Prisma / PostgreSQL

    Cidadao->>UI: Preenche o formulário
    Cidadao->>UI: Seleciona imagens (até 5)
    UI->>CDN: Upload das imagens
    CDN-->>UI: URLs das imagens
    UI->>API: POST { titulo, descricao, materialId, imagens[] }
    API->>API: autorizarRota(["usuario"])
    API->>API: solicitacaoCreateSchema.safeParse()
    alt Dados inválidos
        API-->>UI: 400 { erros por campo }
    else Dados válidos
        API->>Svc: criarSolicitacao(userId, data)
        Svc->>DB: create SolicitacaoColeta (status=pendente)
        DB-->>Svc: solicitação criada
        Svc-->>API: solicitação
        API-->>UI: 201 { solicitação }
        UI-->>Cidadao: Confirmação de envio
    end
```

![Sequência — Criar solicitação](diagrams/APENDICE-E-1.png)

---

## E.2 — Aprovar / rejeitar solicitação (Administrador)

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as Front-end (/admin)
    participant API as PATCH /api/admin/solicitacoes/[id]
    participant Svc as solicitacao.service
    participant DB as Prisma / PostgreSQL

    Admin->>UI: Abre solicitação pendente
    Admin->>UI: Decide aprovar/rejeitar
    UI->>API: PATCH { aprovado: true | false }
    API->>API: autorizarRota(["admin"])
    API->>API: schema.safeParse()
    API->>Svc: atualizarStatusSolicitacao(id, aprovado)
    Svc->>DB: update status = aprovada | rejeitada
    DB-->>Svc: solicitação atualizada
    Svc-->>API: solicitação
    API-->>UI: 200 { solicitação }
    UI-->>Admin: Status atualizado
```

![Sequência — Aprovar/rejeitar solicitação](diagrams/APENDICE-E-2.png)

---

## E.3 — Aceitar solicitação (Empresa)

```mermaid
sequenceDiagram
    actor Empresa
    participant UI as Front-end (/empresa)
    participant API as POST /api/empresa/coletas
    participant Svc as coleta.service
    participant DB as Prisma / PostgreSQL

    Empresa->>UI: Seleciona solicitação aprovada
    UI->>API: POST { solicitacaoId, dataPrevisaoColeta? }
    API->>API: autorizarRota(["empresa"])
    API->>Svc: aceitarSolicitacao(solicitacaoId, companyId, previsao)
    Svc->>DB: findUnique Coleta por solicitacaoId
    alt Já aceita por outra empresa
        DB-->>Svc: coleta existente
        Svc-->>API: erro
        API-->>UI: 400 "Solicitação já foi aceita"
    else Disponível
        DB-->>Svc: null
        Svc->>Svc: gerarCodigoConfirmacao()
        Svc->>DB: create Coleta (status=aceita)
        DB-->>Svc: coleta criada
        Svc-->>API: coleta
        API-->>UI: 201 { coleta + código }
        UI-->>Empresa: Coleta criada
    end
```

![Sequência — Aceitar solicitação](diagrams/APENDICE-E-3.png)

---

## E.4 — Concluir coleta com código de confirmação (Empresa)

```mermaid
sequenceDiagram
    actor Empresa
    actor Cidadao as Cidadão
    participant UI as Front-end (/empresa/coletas/[id])
    participant API as PATCH /api/empresa/coletas/[id]
    participant Svc as coleta.service
    participant DB as Prisma / PostgreSQL

    Cidadao->>Empresa: Informa o código de confirmação
    Empresa->>UI: Seleciona status "concluida" + código
    UI->>API: PATCH { status: "concluida", codigoConfirmacao }
    API->>API: autorizarRota(["empresa"])
    API->>API: coletaStatusSchema.safeParse()
    API->>DB: findFirst Coleta por (id, companyId)
    alt Código ausente ou inválido
        API-->>UI: 400 "Código inválido"
    else Código correto
        API->>Svc: atualizarStatusColeta(id, companyId, "concluida")
        Svc->>DB: update status=concluida + dataConclusao
        DB-->>Svc: coleta atualizada
        Svc-->>API: coleta
        API-->>UI: 200 { coleta }
        UI-->>Empresa: Coleta concluída
    end
```

![Sequência — Concluir coleta com código](diagrams/APENDICE-E-4.png)

---

## E.5 — Enviar mensagem no chat da coleta

```mermaid
sequenceDiagram
    actor Remetente as Cidadão / Empresa
    participant UI as Chat da coleta
    participant API as POST /api/mensagens/[id]
    participant Svc as mensagem.service
    participant DB as Prisma / PostgreSQL

    Remetente->>UI: Digita e envia a mensagem
    UI->>API: POST { coletaId, mensagem }
    API->>Svc: enviarMensagem(coletaId, remetenteId, mensagem)
    Svc->>DB: verificarAcessoColeta(coletaId, userId)
    alt Sem permissão
        DB-->>Svc: não autorizado
        Svc-->>API: erro
        API-->>UI: 403 "Sem permissão"
    else Autorizado
        DB-->>Svc: coleta
        Svc->>DB: create Mensagem
        DB-->>Svc: mensagem criada
        Svc-->>API: mensagem
        API-->>UI: 201 { mensagem }
        UI-->>Remetente: Mensagem exibida na conversa
    end
```

![Sequência — Enviar mensagem no chat](diagrams/APENDICE-E-5.png)
