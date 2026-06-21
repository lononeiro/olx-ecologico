# APÊNDICE D — Diagrama de Atividades

Diagrama de atividades do fluxo principal do **ECOnecta**: da criação da solicitação pelo cidadão,
passando pela moderação do administrador, até a execução e conclusão da coleta pela empresa.

> Cole o bloco abaixo em <https://mermaid.live> ou visualize direto no GitHub/VS Code.

```mermaid
flowchart TD
    inicio([Início]) --> criar[Cidadão cria solicitação de coleta]
    criar --> imgs[Anexa de 0 a 5 imagens]
    imgs --> valida{Dados válidos?}
    valida -- Não --> erroV[Exibe erros de validação]
    erroV --> criar
    valida -- Sim --> pendente[Solicitação salva como pendente]

    pendente --> analisa[Administrador analisa a solicitação]
    analisa --> decisao{Aprovar?}
    decisao -- Não --> rejeitada[Status: rejeitada]
    rejeitada --> fimRej([Fim])

    decisao -- Sim --> aprovada[Status: aprovada / disponível]
    aprovada --> espera[Disponível para empresas]

    espera --> aceita{Empresa aceita?}
    aceita -- Não --> espera
    aceita -- Sim --> verifica{Já aceita por outra empresa?}
    verifica -- Sim --> erroA[Erro: já aceita]
    erroA --> espera
    verifica -- Não --> coleta[Cria Coleta + gera código de confirmação]

    coleta --> caminho[Status: a_caminho]
    caminho --> emcoleta[Status: em_coleta]
    emcoleta --> chat[/Cidadão e empresa trocam mensagens/]
    chat --> codigo{Código de confirmação correto?}
    codigo -- Não --> emcoleta
    codigo -- Sim --> concluida[Status: concluida + dataConclusao]
    concluida --> fim([Fim])

    caminho -. a qualquer momento .-> cancelada[Status: cancelada]
    emcoleta -. a qualquer momento .-> cancelada
    cancelada --> fimCan([Fim])
```

### Imagem renderizada

![Diagrama de Atividades](diagrams/APENDICE-D-1.png)

## Observações sobre o fluxo

- A **validação** dos dados ocorre tanto no cliente quanto no servidor (Zod).
- A solicitação só fica visível para empresas quando `status = aprovada` **e** ainda não possui coleta.
- O **código de confirmação** é gerado no aceite e fica visível para o cidadão; a empresa precisa
  informá-lo para concluir a coleta.
- O status `cancelada` pode ser atingido a partir de qualquer etapa em andamento da coleta.
