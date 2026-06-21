# APÊNDICE C — Diagrama de Classes de Dados

Diagrama de classes de dados do **ECOnecta**, derivado do modelo Prisma (`prisma/schema.prisma`).
Apresenta os atributos, tipos e as multiplicidades dos relacionamentos.

> Cole o bloco abaixo em <https://mermaid.live> ou visualize direto no GitHub/VS Code.

```mermaid
classDiagram
    class Role {
        +int id
        +string nome
    }

    class User {
        +int id
        +string nome
        +string? endereco
        +string? telefone
        +string email
        +string senhaHash
        +string status
        +int roleId
        +datetime createdAt
        +string? resetToken
        +datetime? resetTokenExpiry
    }

    class Company {
        +int id
        +int userId
        +string cnpj
        +string? descricao
        +datetime createdAt
    }

    class MaterialTipo {
        +int id
        +string nome
    }

    class SolicitacaoColeta {
        +int id
        +string titulo
        +string descricao
        +string quantidade
        +string endereco
        +string status
        +bool aprovado
        +int userId
        +int materialId
        +datetime createdAt
    }

    class SolicitacaoImagem {
        +int id
        +int solicitacaoId
        +string url
    }

    class Coleta {
        +int id
        +int solicitacaoId
        +int companyId
        +string status
        +string? codigoConfirmacao
        +datetime dataAceite
        +datetime? dataPrevisaoColeta
        +datetime? dataConclusao
    }

    class Mensagem {
        +int id
        +int coletaId
        +int remetenteId
        +string mensagem
        +datetime createdAt
    }

    Role "1" --> "0..*" User : possui
    User "1" --> "0..1" Company : é
    User "1" --> "0..*" SolicitacaoColeta : cria
    User "1" --> "0..*" Mensagem : envia
    MaterialTipo "1" --> "0..*" SolicitacaoColeta : classifica
    SolicitacaoColeta "1" --> "0..*" SolicitacaoImagem : contém
    SolicitacaoColeta "1" --> "0..1" Coleta : gera
    Company "1" --> "0..*" Coleta : executa
    Coleta "1" --> "0..*" Mensagem : agrupa
```

### Imagem renderizada

![Diagrama de Classes de Dados](diagrams/APENDICE-C-1.png)

## Multiplicidades

| Origem | Destino | Cardinalidade | Observação |
|--------|---------|---------------|------------|
| Role | User | 1 : N | Cada usuário tem exatamente uma role |
| User | Company | 1 : 0..1 | Apenas usuários do tipo empresa possuem `Company` (`userId` único) |
| User | SolicitacaoColeta | 1 : N | Solicitações criadas pelo cidadão |
| User | Mensagem | 1 : N | Mensagens enviadas (remetente) |
| MaterialTipo | SolicitacaoColeta | 1 : N | Tipo de material da solicitação |
| SolicitacaoColeta | SolicitacaoImagem | 1 : N | Até 5 imagens por solicitação (regra de negócio) |
| SolicitacaoColeta | Coleta | 1 : 0..1 | Uma solicitação gera no máximo uma coleta (`solicitacaoId` único) |
| Company | Coleta | 1 : N | Coletas executadas pela empresa |
| Coleta | Mensagem | 1 : N | Conversa vinculada à coleta |
