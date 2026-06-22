# 01 — Visão Geral — ECOnecta

**ECOnecta** (pacote `recycling-system`) é uma plataforma full-stack de economia circular que intermedia a doação/coleta de materiais recicláveis entre **cidadãos** (quem tem o material), **empresas coletoras** (quem coleta) e **administradores** (quem modera).

## Fluxo central
Cidadão cria solicitação → Admin aprova/rejeita → solicitação aprovada vira disponível no marketplace → Empresa aceita (cria *Coleta*) → Empresa atualiza status (`aceita → a_caminho → em_coleta → concluida`) → Cidadão avalia a empresa (1–5★). Há chat antes do aceite (negociação) e durante a coleta, além de notificações em tempo real (SSE).

## Stack (confirmada em `package.json`)
| Camada | Tecnologia |
|--------|-----------|
| Framework web | Next.js 15.5 (App Router) + React 19 |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS 3.4 |
| ORM / Banco | Prisma 5.22 / PostgreSQL |
| Auth web | NextAuth 4.24 (Credentials + JWT) |
| Auth mobile | JWT próprio (`jose`, HS256) — access + refresh |
| Validação | Zod 3 (`packages/shared`) |
| Imagens | Cloudinary (`next-cloudinary`) |
| Mapa / CEP | Leaflet + ViaCEP |
| Mobile | Expo / React Native (`apps/mobile`) |
| Tempo real | Server-Sent Events |

## Monorepo
```
apps/mobile/      # app Expo / React Native (auth JWT)
packages/shared/  # Zod, status e contratos (web + mobile)
prisma/           # schema, migrations, seed
src/              # app web Next.js (raiz)
```

## Atores
| Ator | role | Papel |
|------|------|-------|
| Cidadão | `usuario` | Cria/acompanha/cancela solicitações; avalia |
| Empresa | `empresa` | Aceita e executa coletas; negocia; recebe avaliações |
| Administrador | `admin` | Modera e gerencia usuários/empresas/materiais |
| Cloudinary / ViaCEP | — | Sistemas externos |

> Documento completo: [`documentacao-uml-completa.md`](documentacao-uml-completa.md).
