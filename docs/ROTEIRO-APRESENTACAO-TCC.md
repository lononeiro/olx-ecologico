# Roteiro de Apresentação — ECOnecta (mobile + web)

Roteiro pra demonstrar o fluxo completo do sistema alternando entre o **app mobile** (cidadão)
e o **site web** (empresa), do jeito que você combinou: solicitação nasce no celular, empresa
conduz tudo pelo navegador até finalizar.

## Antes de começar

- [ ] Celular com o app aberto e **deslogado** (ou já logado como cidadão — ver credenciais).
- [ ] Notebook/PC com o navegador aberto em `http://localhost:3000` (ou a URL de produção).
- [ ] Servidor rodando (`npm run dev`).
- [ ] Ideal: os dois lado a lado / projetados, pra plateia ver a mesma solicitação em ambos.

**Credenciais sugeridas:**

| Papel | Onde | E-mail | Senha |
|---|---|---|---|
| Cidadão | 📱 Mobile | `joao@example.com` | `Lucas12!` |
| Empresa | 💻 Web | `empresa@recicla.com` (ReciclaMax) | `Lucas12!` |
| Admin *(opcional, no fim)* | 💻 Web | `admin@recicla.com` | `Lucas12!` |

> Se quiser abrir com o cadastro em vez de login direto, dá pra mostrar rapidinho o `/register`
> no mobile ou na web antes do passo 1 — mas não é obrigatório, o login já basta pra contar a
> história completa.

---

## Parte 1 — 📱 Cidadão cria a solicitação (mobile)

1. **Login** com `joao@example.com`.
2. **Tela inicial** — aponte as duas seções: *"Em andamento"* (coletas já aceitas) e
   *"Aguardando empresa"* (publicadas, ninguém aceitou ainda). Aproveite pra **puxar a tela pra
   baixo** e mostrar a animação de recarregar (ícone de reciclagem girando).
3. Toque no **+** → **Nova solicitação**.
4. Preencha: título, descrição, quantidade, endereço, tipo de material.
5. **Anexe 1–2 fotos** (sobe direto pro Cloudinary — bom momento pra falar da integração).
6. Envie. Destaque: a solicitação **já nasce publicada** (status `aprovada`), sem passar por
   fila de aprovação do admin — é uma regra de negócio do sistema, vale mencionar.
7. Volte pra Home e mostre a nova solicitação aparecendo em **"Aguardando empresa"**.

---

## Parte 2 — 💻 Empresa encontra e conversa (web)

8. **Login** como `empresa@recicla.com`.
9. **Painel da Empresa** — mostre os KPIs (novas solicitações, em andamento, taxa de conclusão).
10. **Solicitações** → encontre a solicitação criada no celular (a foto do Cloudinary aparece
    aqui também — boa hora pra reforçar que é a mesma solicitação, o mesmo backend).
11. Clique em **"Tirar dúvida"** → chat pré-aceite → mande uma mensagem perguntando algo
    (ex.: horário disponível).

---

## Parte 3 — 📱 Cidadão responde (mobile)

12. Volte pro celular → abra a solicitação → aba de conversa → a mensagem da empresa está lá.
13. Responda pelo celular. *(Mostra que a negociação pré-aceite funciona nos dois lados.)*

---

## Parte 4 — 💻 Empresa aceita (web)

14. Na web, volte pra solicitação → **"Ver localização e aceitar"**.
15. Aceite — o sistema gera um **código de confirmação** e cria a *Coleta* com status `aceita`.
16. Mostre em **"Minhas Coletas"** a nova coleta na lista.

---

## Parte 5 — 📱 Acompanhamento em tempo real (mobile)

17. No celular, **puxe pra atualizar** a Home de novo — a solicitação migra de "Aguardando
    empresa" pra **"Em andamento"**, já com o badge **Aceita**.
18. Abra o detalhe da solicitação e mostre o **tracker de progresso** e o **código de
    confirmação** (o cidadão vai precisar informá-lo pessoalmente pra empresa depois).

---

## Parte 6 — 💻 Empresa executa a coleta (web)

19. Web → **Minhas Coletas** → abra a coleta → avance o status: `Aceita` → `A caminho` →
    `Em coleta`. Mostre o tracker mudando a cada clique.
20. Troque uma mensagem no **chat da coleta** (o chat pós-aceite, diferente do pré-aceite da
    Parte 2) — pode fazer pelo mobile ou pela web, os dois têm.

---

## Parte 7 — 💻 Conclusão (web)

21. Peça o código de confirmação que está na tela do celular (Parte 5, passo 18).
22. Web → insira o código → conclua a coleta → status vira **Concluída**.

---

## Parte 8 — 📱 Avaliação (mobile)

23. No celular, abra a solicitação concluída — o **modal de avaliação abre sozinho**
    automaticamente (é reativo à conclusão). Dê uma nota de 1 a 5 estrelas e um comentário.

---

## Parte 9 — 💻 Reputação (web)

24. Web → **Avaliações** da empresa → mostre a nova nota entrando na média e na distribuição
    por estrelas.

---

## Bônus (opcional, se sobrar tempo) — 💻 Admin

25. Login como `admin@recicla.com`.
26. **Dashboard** com gráficos (solicitações por mês, coletas por status, empresas em destaque).
27. **Gestão de Solicitações** → explique a moderação **reativa**: não existe fila de aprovação,
    o admin só remove uma solicitação publicada se identificar abuso (bom gancho pra falar da
    mudança de regra de negócio que vocês fizeram).

---

## Coisas que dá pra citar de passagem, sem precisar de tela extra

- **Notificações em tempo real** (SSE) — o sininho atualiza sozinho a cada novo evento
  (mensagem, aceite, avaliação), sem precisar recarregar a página.
- **Privacidade** — antes do aceite, endereço e contato do cidadão aparecem mascarados pra
  empresa (`lib/privacy.ts`); só liberam de verdade depois que a coleta é aceita.
- **Cancelamento** — se der tempo, mostre no mobile ou na web que o cidadão pode cancelar uma
  solicitação (regras: não dá se já tiver coleta avançada).

---

## Tempo estimado

~15–20 min pra ir de ponta a ponta com calma, alternando os dois dispositivos. Se precisar
cortar, o bônus do admin é o primeiro a sacrificar — o miolo (Partes 1–8) é o que conta a
história completa do produto.
