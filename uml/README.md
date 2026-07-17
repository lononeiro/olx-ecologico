# Documentação UML — ECOnecta

Conjunto de diagramas UML gerado por engenharia reversa do código-fonte, **organizado por tipo de
diagrama** (uma pasta por tipo). Versão **completa e atualizada** — inclui as features recentes
(avaliações, chat pré-aceite e notificações) que **não** constam dos apêndices originais A–H em
[`../`](../).

## Organização

```
docs/uml/
├─ 1-casos-de-uso/            casos-de-uso.puml + descricoes-casos-de-uso.md
├─ 2-classes-de-dados/        classes-de-dados.puml  (12 entidades)
├─ 3-atividades/              atividades.puml        (macro, autenticação, cancelamento)
├─ 4-sequencia/              SEQ-01…15.puml + sequencias.md (descrições)
├─ 5-entidade-relacionamento/ der.puml               (12 tabelas)
├─ 6-dicionario-de-dados/     dicionario-de-dados.md (12 tabelas + enums)
├─ 7-classes-participantes/   CP-01…10.puml + classes-participantes.md  (robustez)
├─ 8-arquitetura/  (extras)   componentes · deploy · pacotes · estados · classes-com-servicos
│
├─ documentacao-uml-completa.md   documento mestre (20 seções)
├─ matriz-rastreabilidade.md
└─ glossario.md

Cada pasta tem uma subpasta render/ com os PNG e SVG já gerados.
```

## Os 7 tipos solicitados

| # | Tipo | Pasta | Diagramas | Status |
|---|------|-------|-----------|--------|
| 1 | Casos de uso | `1-casos-de-uso/` | 1 (UC01–UC25) | ✅ atualizado (+4 casos novos) |
| 2 | Classes de dados | `2-classes-de-dados/` | 1 (12 classes) | ✅ atualizado (+4 entidades) |
| 3 | Atividades | `3-atividades/` | 3 | ✅ atualizado (inclui avaliação) |
| 4 | Sequência | `4-sequencia/` | 15 | ✅ ampliado (de 5 → 15 fluxos) |
| 5 | Entidade–Relacionamento | `5-entidade-relacionamento/` | 1 (12 tabelas) | ✅ atualizado (+4 tabelas) |
| 6 | Dicionário de dados | `6-dicionario-de-dados/` | tabela (12 tabelas) | ✅ atualizado (+4 tabelas, +enums) |
| 7 | Classes participantes | `7-classes-participantes/` | 10 (robustez) | ✅ ampliado (de 6 → 10) |

## O que mudou em relação aos apêndices A–H

Os apêndices originais (`../APENDICE-A..H`) descreviam **8 entidades** e não cobriam três features já
implementadas. Esta pasta corrige e completa:

- **+4 entidades / tabelas:** `Avaliacao`, `ConversaSolicitacao`, `MensagemPreAceite`, `Notificacao`.
- **+4 casos de uso:** UC22 Cancelar, UC23 Avaliar, UC24 Negociar (pré-aceite), UC25 Reputação (+ UC15 Notificações).
- **+10 sequências** novas (cadastro, recuperação de senha, listagem, cancelamento, negociação, avaliação, SSE, CEP…).
- **+3 diagramas de robustez** (negociar, avaliar, notificações).
- **Correção:** o UC14 (concluir coleta) afirmava validar o código de confirmação — o backend real **não**
  valida. Detalhado em `1-casos-de-uso/descricoes-casos-de-uso.md`.

## Como usar no TCC

- **Imagens:** use os `.png` de cada `render/` (fundo branco). Para impressão vetorial, os `.svg`.
- **Textos prontos:** `descricoes-casos-de-uso.md`, `sequencias.md`, `classes-participantes.md` e
  `dicionario-de-dados.md` trazem texto pronto para colar.

## Re-renderizar

Imagens geradas com `plantuml.jar` v1.2023.13 (Java 8), sempre com `-charset UTF-8`:

```bash
curl -L --ssl-no-revoke -o plantuml.jar \
  https://github.com/plantuml/plantuml/releases/download/v1.2023.13/plantuml-1.2023.13.jar
for d in 1-casos-de-uso 2-classes-de-dados 3-atividades 4-sequencia \
         5-entidade-relacionamento 7-classes-participantes 8-arquitetura; do
  java -jar plantuml.jar -charset UTF-8 -tpng -o render docs/uml/$d/*.puml
  java -jar plantuml.jar -charset UTF-8 -tsvg -o render docs/uml/$d/*.puml
done
```
