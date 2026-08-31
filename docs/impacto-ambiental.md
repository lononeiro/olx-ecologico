# Cálculo de Impacto Ambiental — Metodologia

Este documento descreve **como o ECOnecta estima o impacto ambiental** das coletas
concluídas (kg reciclados, CO₂ evitado, água e energia poupadas e árvores
preservadas). Foi escrito para dar suporte à defesa do TCC: qualquer número
exibido nos painéis pode ser rastreado até as regras abaixo.

Código-fonte de referência: [`src/lib/impacto.ts`](../src/lib/impacto.ts)
(com testes em [`src/lib/impacto.test.ts`](../src/lib/impacto.test.ts)).

---

## 1. Visão geral

O impacto de cada coleta é calculado em duas etapas:

```
impacto_da_coleta = peso_em_kg  ×  fator_do_material
```

Depois somamos o impacto de todas as coletas concluídas de um usuário (painel do
cidadão) ou de uma empresa (painel da empresa). O ponto sensível é obter o
**peso em kg** de forma confiável — e é aí que entra o modelo híbrido.

---

## 2. Modelo híbrido de obtenção do peso

Como a quantidade historicamente era um **texto livre** (ex.: "50 kg",
"10 sacos", "3 caixas"), converter isso em massa é ambíguo. Adotamos um modelo
híbrido, implementado em `resolverPesoKg()`:

1. **Peso informado (fonte confiável).** No cadastro da solicitação existe um
   campo opcional **"Peso aproximado"** (valor numérico + unidade: kg ou
   toneladas). Quando preenchido, é convertido para kg e salvo no banco em
   `SolicitacaoColeta.pesoEstimadoKg`. **Esse valor tem prioridade** no cálculo.

2. **Peso estimado (fallback heurístico).** Quando o usuário não informa o peso,
   estimamos a massa a partir do texto livre `quantidade`, com o parser descrito
   na seção 3.

Cada coleta é rotulada como **"informado"** ou **"estimado"**, e os painéis
mostram essa proporção (ex.: *"7 de 10 coletas com peso informado"*). Isso torna
a estimativa **auditável e honesta**: fica explícito quanto do número vem de dado
declarado e quanto vem de heurística.

> **Decisão de projeto:** optamos pelo híbrido (e não por tornar o peso
> obrigatório) para não adicionar atrito ao cadastro e para não invalidar as
> solicitações antigas, que continuam sendo estimadas pelo parser.

---

## 3. Parser de quantidade (fallback)

Implementado em `estimarKg()`. Regras aplicadas ao texto, em ordem:

1. Extrai o **primeiro número** do texto (aceita vírgula ou ponto decimal).
   Sem número reconhecível → retorna `0` (a coleta é contada, mas não soma peso).
2. Identifica a **unidade** por palavra-chave e converte para kg:

| Palavra-chave no texto        | Conversão para kg         |
| ----------------------------- | ------------------------- |
| `t`, `tonelada`               | valor × 1000              |
| `g`, `grama` (sem `kg`)       | valor ÷ 1000              |
| `kg`, `quilo`                 | valor (direto)            |
| `saco`                        | valor × 5 kg *(estimado)* |
| `caixa`                       | valor × 8 kg *(estimado)* |
| `litro`, `l`, `lt`            | valor × 1 (densidade ≈ água) |
| `unidade`, `un`, `peça`, `item` | valor × 1 kg *(estimado)* |
| só número, sem unidade        | assume kg                 |

Os pesos por "saco/caixa/unidade" são **premissas médias** e são a maior fonte de
imprecisão do fallback — justamente por isso o campo de peso informado existe.

---

## 4. Fatores de conversão por material

Implementados na tabela `FATORES` de `src/lib/impacto.ts`. Cada material é
classificado numa categoria por palavra-chave (`categoriaMaterial()`), e cada
categoria tem quatro fatores **por kg reciclado**:

| Categoria    | CO₂ evitado (kg/kg) | Água poupada (L/kg) | Energia (kWh/kg) | Árvores (por kg) |
| ------------ | ------------------- | ------------------- | ---------------- | ---------------- |
| Metal/alumínio | 8,0               | 15                  | 9,0              | 0                |
| Plástico     | 1,8                 | 20                  | 5,8              | 0                |
| Papel/papelão | 1,1                | 26                  | 4,0              | 0,017            |
| Vidro        | 0,3                 | 2                   | 0,6              | 0                |
| Orgânico     | 0,5                 | 0                   | 0,2              | 0                |
| Eletrônico   | 1,4                 | 10                  | 6,0              | 0                |
| Óleo         | 3,0                 | 25                  | 2,0              | 0                |
| Têxtil       | 3,6                 | 100                 | 2,0              | 0                |
| Madeira      | 0,9                 | 5                   | 1,0              | 0,008            |
| Borracha/pneu | 2,5                | 8                   | 3,0              | 0                |
| Outro (padrão) | 1,0               | 10                  | 2,0              | 0                |

**Interpretação:** os fatores representam o benefício evitado ao reciclar 1 kg do
material em vez de descartá-lo/produzi-lo com matéria virgem. Ex.: metais têm
CO₂ e energia altíssimos porque produzir alumínio a partir da bauxita é muito
mais intensivo do que reciclar. Árvores preservadas só se aplicam a materiais de
base celulósica (papel ≈ 17 árvores por tonelada; madeira em menor grau).

### Sobre as fontes

Os valores da tabela são **médias consolidadas** a partir das referências abaixo,
adaptadas para a unidade "por kg" (quando a fonte publica por tonelada, dividimos
por 1000) e **arredondadas**. Servem para comunicar **ordem de grandeza** do
benefício ambiental, não para contabilidade oficial de carbono. Estão
centralizados numa única tabela no código (`FATORES`), então trocar por valores
exatos de uma fonte primária é uma alteração de um ponto só.

#### Referências

**CO₂ evitado (por material)**
- Bureau of International Recycling (BIR). *Report on the Environmental Benefits
  of Recycling* (2008; atualização 2016). Publica toneladas de CO₂ evitadas por
  tonelada reciclada para alumínio, aço, papel, plásticos, etc.
  https://www.bir.org
- U.S. Environmental Protection Agency (EPA). *WARM — Waste Reduction Model*
  (fatores de emissão de GEE por material). https://www.epa.gov/warm

**Energia e água poupadas**
- The Aluminum Association — reciclar alumínio economiza ~95% da energia da
  produção primária. https://www.aluminum.org
- Estatísticas amplamente citadas para papel: reciclar 1 tonelada de papel
  poupa da ordem de **26 mil litros de água** e **~4.100 kWh de energia**
  (ex.: campanhas de reciclagem e materiais setoriais).

**Árvores preservadas (papel/madeira)**
- Estimativa clássica: reciclar 1 tonelada de papel evita o corte de
  **~17 árvores** (≈ 0,017 árvore por kg).

**Contexto brasileiro (recomendado citar no TCC)**
- CEMPRE — Compromisso Empresarial para Reciclagem. *CEMPRE Review* e fichas
  técnicas por material. https://cempre.org.br
- Ministério do Meio Ambiente / SNIS — Sistema Nacional de Informações sobre
  Saneamento (dados de resíduos sólidos no Brasil).

**Metodologia geral**
- Estudos de **Análise de Ciclo de Vida (ACV / LCA)** por tipo de material, que
  comparam o material reciclado à produção com matéria virgem.

> **Nota de honestidade para a defesa:** os fatores foram consolidados dessas
> fontes e arredondados para uma tabela didática. Se a banca exigir rastreio
> exato, o passo recomendado é escolher **uma fonte primária** (ex.: EPA WARM
> ou BIR) e substituir cada linha da tabela pelo valor publicado, mantendo a
> mesma estrutura de cálculo.

---

## 5. Fórmulas finais

Para o conjunto de coletas concluídas `C`:

```
kg_total       = Σ  peso_kg(coleta)                       para cada coleta em C
co2_evitado    = Σ  peso_kg(coleta) × fator.co2(material)
agua_poupada   = Σ  peso_kg(coleta) × fator.agua(material)
energia        = Σ  peso_kg(coleta) × fator.energia(material)
arvores        = Σ  peso_kg(coleta) × fator.arvores(material)
```

onde `peso_kg(coleta)` = peso informado, se houver; senão, `estimarKg(quantidade)`.

---

## 6. Limitações declaradas

- O **fallback por texto** é uma estimativa; unidades como "sacos/caixas" usam
  pesos médios arbitrados.
- Os **fatores são médias**; o valor real varia com tecnologia, logística e
  origem do material.
- Números por extenso ("uma caixa") não são lidos pelo parser (retornam 0).
- A ferramenta comunica **impacto estimado**, não uma medição auditada.

Essas limitações são **mitigadas** pelo campo de peso informado e pela exibição
transparente da proporção informado/estimado.

---

## 7. Como responder à banca (resumo)

> *"O número vem de peso × fator. O peso, quando o usuário informa, é dado
> declarado e salvo no banco; quando não informa, é estimado por um parser com
> regras explícitas. Os fatores por material são médias da literatura de
> reciclagem, centralizados em uma tabela. A interface mostra quantas coletas
> têm peso informado versus estimado, então a estimativa é transparente e
> auditável."*
