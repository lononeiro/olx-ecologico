# Documentação — ECOnecta

Plataforma para conectar **cidadãos**, **administradores** e **empresas coletoras** no processo de
solicitação e coleta de materiais recicláveis.

Este diretório reúne os apêndices de documentação do TCC. Os diagramas estão em
**Mermaid** (renderizam direto no GitHub, VS Code e em <https://mermaid.live>) e o
**Diagrama de Casos de Uso** está em **PlantUML** (renderiza em <https://www.plantuml.com/plantuml> ou
com a extensão *PlantUML* do VS Code).

## Índice

| Apêndice | Conteúdo | Arquivo |
|----------|----------|---------|
| A | Diagrama de Casos de Uso | [APENDICE-A-casos-de-uso.md](APENDICE-A-casos-de-uso.md) |
| B | Descrições de Casos de Uso | [APENDICE-B-descricoes-casos-de-uso.md](APENDICE-B-descricoes-casos-de-uso.md) |
| C | Diagrama de Classes de Dados | [APENDICE-C-classes-de-dados.md](APENDICE-C-classes-de-dados.md) |
| D | Diagrama de Atividades | [APENDICE-D-atividades.md](APENDICE-D-atividades.md) |
| E | Diagrama de Sequência | [APENDICE-E-sequencia.md](APENDICE-E-sequencia.md) |
| F | Diagrama de Entidade e Relacionamento | [APENDICE-F-entidade-relacionamento.md](APENDICE-F-entidade-relacionamento.md) |
| G | Dicionário de Dados | [APENDICE-G-dicionario-de-dados.md](APENDICE-G-dicionario-de-dados.md) |
| H | Diagramas de Classes Participantes | [APENDICE-H-classes-participantes.md](APENDICE-H-classes-participantes.md) |

## Atores do sistema

| Ator | Perfil (`role`) | Responsabilidade |
|------|-----------------|------------------|
| Cidadão / Usuário | `usuario` | Cria solicitações de coleta e acompanha o andamento |
| Empresa Coletora | `empresa` | Aceita solicitações aprovadas e executa as coletas |
| Administrador | `admin` | Modera solicitações e gerencia usuários, empresas e materiais |

## Imagens renderizadas

As versões em imagem de todos os diagramas já estão geradas em **[`diagrams/`](diagrams/)**
(PNG, fundo branco, prontas para colar no Word/PDF do TCC). Cada apêndice já referencia a sua imagem.

| Apêndice | Arquivo de imagem |
|----------|-------------------|
| A | `diagrams/APENDICE-A-1.png` (+ `.svg`) |
| C | `diagrams/APENDICE-C-1.png` |
| D | `diagrams/APENDICE-D-1.png` |
| E | `diagrams/APENDICE-E-1.png` … `APENDICE-E-5.png` |
| F | `diagrams/APENDICE-F-1.png` |
| H | `diagrams/APENDICE-H-1.png` … `APENDICE-H-6.png` |

A pasta também contém os fontes `.mmd` (Mermaid) e `.puml` (PlantUML) de cada diagrama.

## Como re-renderizar / exportar os diagramas

- **Mermaid** → cole o bloco em <https://mermaid.live> e exporte PNG/SVG, ou use a extensão
  *Markdown Preview Mermaid Support* no VS Code. Em lote:
  `npx @mermaid-js/mermaid-cli -i diagrams/APENDICE-C-1.mmd -o diagrams/APENDICE-C-1.png -b white -s 2`
- **PlantUML** → cole o bloco em <https://www.plantuml.com/plantuml/uml> ou use a extensão *PlantUML*.
