# APÊNDICE H — Diagramas de Classes Participantes

Diagramas de classes participantes (análise de robustez) dos principais casos de uso do **ECOnecta**.
Cada diagrama organiza as classes em três estereótipos:

- **«boundary»** (fronteira) — telas e rotas de API que fazem a interface com o ator;
- **«control»** (controle) — regras de negócio (camada de serviço / validação);
- **«entity»** (entidade) — dados persistidos (modelos Prisma).

> Cole cada bloco em <https://mermaid.live> ou visualize direto no GitHub/VS Code.

---

## H.1 — Criar solicitação de coleta (UC05)

```mermaid
flowchart LR
    actor((Cidadão))

    subgraph boundary["«boundary»"]
        telaNova["Tela Nova Solicitação"]
        cloud["Cloudinary (upload)"]
        apiSol["POST /api/solicitacoes"]
    end

    subgraph control["«control»"]
        valSchema["solicitacaoCreateSchema"]
        svcCriar["criarSolicitacao()"]
    end

    subgraph entity["«entity»"]
        eSol[(SolicitacaoColeta)]
        eImg[(SolicitacaoImagem)]
        eMat[(MaterialTipo)]
    end

    actor --> telaNova
    telaNova --> cloud
    telaNova --> apiSol
    apiSol --> valSchema
    valSchema --> svcCriar
    svcCriar --> eSol
    svcCriar --> eImg
    eSol --> eMat
```

![Classes participantes — Criar solicitação](diagrams/APENDICE-H-1.png)

---

## H.2 — Aprovar / rejeitar solicitação (UC17/UC18)

```mermaid
flowchart LR
    actor((Administrador))

    subgraph boundary["«boundary»"]
        telaAdmin["Tela Admin Solicitações"]
        apiAdmin["PATCH /api/admin/solicitacoes/[id]"]
    end

    subgraph control["«control»"]
        guard["autorizarRota(['admin'])"]
        svcStatus["atualizarStatusSolicitacao()"]
    end

    subgraph entity["«entity»"]
        eSol[(SolicitacaoColeta)]
    end

    actor --> telaAdmin
    telaAdmin --> apiAdmin
    apiAdmin --> guard
    guard --> svcStatus
    svcStatus --> eSol
```

![Classes participantes — Aprovar/rejeitar solicitação](diagrams/APENDICE-H-2.png)

---

## H.3 — Aceitar solicitação (UC11)

```mermaid
flowchart LR
    actor((Empresa))

    subgraph boundary["«boundary»"]
        telaSolic["Tela Solicitações Aprovadas"]
        apiAceitar["POST /api/empresa/coletas"]
    end

    subgraph control["«control»"]
        guard["autorizarRota(['empresa'])"]
        svcAceitar["aceitarSolicitacao()"]
        gerarCod["gerarCodigoConfirmacao()"]
    end

    subgraph entity["«entity»"]
        eSol[(SolicitacaoColeta)]
        eColeta[(Coleta)]
        eCompany[(Company)]
    end

    actor --> telaSolic
    telaSolic --> apiAceitar
    apiAceitar --> guard
    guard --> svcAceitar
    svcAceitar --> gerarCod
    svcAceitar --> eSol
    svcAceitar --> eColeta
    eColeta --> eCompany
```

![Classes participantes — Aceitar solicitação](diagrams/APENDICE-H-3.png)

---

## H.4 — Atualizar / concluir coleta (UC13/UC14)

```mermaid
flowchart LR
    actor((Empresa))

    subgraph boundary["«boundary»"]
        telaColeta["Tela Detalhe da Coleta"]
        apiColeta["PATCH /api/empresa/coletas/[id]"]
    end

    subgraph control["«control»"]
        guard["autorizarRota(['empresa'])"]
        valStatus["coletaStatusSchema"]
        validaCod["Valida código de confirmação"]
        svcStatus["atualizarStatusColeta()"]
    end

    subgraph entity["«entity»"]
        eColeta[(Coleta)]
    end

    actor --> telaColeta
    telaColeta --> apiColeta
    apiColeta --> guard
    guard --> valStatus
    valStatus --> validaCod
    validaCod --> svcStatus
    svcStatus --> eColeta
```

![Classes participantes — Atualizar/concluir coleta](diagrams/APENDICE-H-4.png)

---

## H.5 — Enviar mensagem no chat (UC09/UC15)

```mermaid
flowchart LR
    actor((Cidadão / Empresa))

    subgraph boundary["«boundary»"]
        telaChat["Chat da Coleta"]
        apiMsg["POST /api/mensagens/[id]"]
    end

    subgraph control["«control»"]
        valMsg["mensagemCreateSchema"]
        verifAcesso["verificarAcessoColeta()"]
        svcEnviar["enviarMensagem()"]
    end

    subgraph entity["«entity»"]
        eColeta[(Coleta)]
        eMsg[(Mensagem)]
        eUser[(User)]
    end

    actor --> telaChat
    telaChat --> apiMsg
    apiMsg --> valMsg
    valMsg --> verifAcesso
    verifAcesso --> eColeta
    verifAcesso --> svcEnviar
    svcEnviar --> eMsg
    eMsg --> eUser
```

![Classes participantes — Enviar mensagem](diagrams/APENDICE-H-5.png)

---

## H.6 — Autenticar (UC02)

```mermaid
flowchart LR
    actor((Usuário))

    subgraph boundary["«boundary»"]
        telaLogin["Tela de Login"]
        apiAuth["NextAuth / POST /api/auth/mobile/login"]
    end

    subgraph control["«control»"]
        valLogin["loginSchema"]
        verifSenha["Compara hash (bcrypt)"]
        emiteSessao["Emite sessão JWT / tokens"]
    end

    subgraph entity["«entity»"]
        eUser[(User)]
        eRole[(Role)]
    end

    actor --> telaLogin
    telaLogin --> apiAuth
    apiAuth --> valLogin
    valLogin --> verifSenha
    verifSenha --> eUser
    eUser --> eRole
    verifSenha --> emiteSessao
```

![Classes participantes — Autenticar](diagrams/APENDICE-H-6.png)
