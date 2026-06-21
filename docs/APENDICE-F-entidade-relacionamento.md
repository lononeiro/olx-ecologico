# APÊNDICE F — Diagrama de Entidade e Relacionamento (DER)

Modelo entidade-relacionamento do **ECOnecta**, correspondente às tabelas físicas em PostgreSQL
(nomes de tabela conforme `@@map` no `prisma/schema.prisma`).

> Cole o bloco abaixo em <https://mermaid.live> ou visualize direto no GitHub/VS Code.

```mermaid
erDiagram
    roles ||--o{ users : "possui"
    users ||--o| companies : "é"
    users ||--o{ solicitacao_coleta : "cria"
    users ||--o{ mensagens : "envia"
    material_tipos ||--o{ solicitacao_coleta : "classifica"
    solicitacao_coleta ||--o{ solicitacao_imagens : "contém"
    solicitacao_coleta ||--o| coletas : "gera"
    companies ||--o{ coletas : "executa"
    coletas ||--o{ mensagens : "agrupa"

    roles {
        int id PK
        string nome
    }

    users {
        int id PK
        string nome
        string endereco "nullable"
        string telefone "nullable"
        string email UK
        string senhaHash
        string status "default ativo"
        int roleId FK
        datetime createdAt
        string resetToken UK "nullable"
        datetime resetTokenExpiry "nullable"
    }

    companies {
        int id PK
        int userId FK,UK
        string cnpj UK
        string descricao "nullable"
        datetime createdAt
    }

    material_tipos {
        int id PK
        string nome
    }

    solicitacao_coleta {
        int id PK
        string titulo
        string descricao
        string quantidade
        string endereco
        string status "default pendente"
        boolean aprovado "default false"
        int userId FK
        int materialId FK
        datetime createdAt
    }

    solicitacao_imagens {
        int id PK
        int solicitacaoId FK
        string url
    }

    coletas {
        int id PK
        int solicitacaoId FK,UK
        int companyId FK
        string status "default aceita"
        string codigoConfirmacao "nullable"
        datetime dataAceite "default now"
        datetime dataPrevisaoColeta "nullable"
        datetime dataConclusao "nullable"
    }

    mensagens {
        int id PK
        int coletaId FK
        int remetenteId FK
        string mensagem
        datetime createdAt
    }
```

### Imagem renderizada

![Diagrama de Entidade e Relacionamento](diagrams/APENDICE-F-1.png)

## Legenda

- **PK** — chave primária
- **FK** — chave estrangeira
- **UK** — chave única (unique)
- `||--o{` — relacionamento um-para-muitos (1:N)
- `||--o|` — relacionamento um-para-zero-ou-um (1:0..1)

## Chaves e restrições principais

| Tabela | Restrição | Descrição |
|--------|-----------|-----------|
| `users` | `email` UNIQUE | E-mail único por usuário |
| `users` | `resetToken` UNIQUE | Token de redefinição de senha único |
| `companies` | `userId` UNIQUE | Relação 1:1 com `users` |
| `companies` | `cnpj` UNIQUE | CNPJ único por empresa |
| `coletas` | `solicitacaoId` UNIQUE | Uma solicitação gera no máximo uma coleta |
