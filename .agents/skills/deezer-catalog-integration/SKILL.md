---
name: deezer-catalog-integration
description: Integra o catálogo público da Deezer ao autocomplete (/api/songs), adapta a validação de palpites por texto normalizado em /api/game/guess e permite reutilizar a busca no painel /admin.
---

# Deezer Catalog Integration — Busca Externa & Validação

Use esta skill sempre que o usuário solicitar integração, manutenção ou ajuste no autocomplete de músicas via API externa (Deezer), na validação de palpites baseados em título/artista ou na busca assistida de faixas no painel `/admin`.

## 1. Proxy de Busca (`GET /api/songs`)
- **Nunca faça requisições diretas do navegador (Client-Side) para a Deezer** para evitar bloqueios de CORS e permitir cache no servidor. Toda busca deve passar pelo Route Handler `GET /api/songs?q=...`.
- **Regras da Requisição Externa:**
  - Ignore queries com menos de 2 caracteres (`.trim().length < 2`) retornando `[]` imediatamente.
  - Consulte `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=15` usando cache de revalidação (`next: { revalidate: 3600 }`).
- **Limpeza e Deduplicação:**
  - Utilize `track.title_short || track.title` para remover sufixos poluídos como `(Remastered)` ou `- Ao Vivo`.
  - Deduplique resultados pelo par normalizado `title|artist` antes de limitar a resposta final a no máximo **8 itens** no formato `{ externalId, title, artist }`.

## 2. Validação de Palpite Normalizada (`POST /api/game/guess`)
Como o autocomplete externo retorna faixas que não estão necessariamente cadastradas na tabela local `songs`, a validação no back-end deve comparar strings normalizadas em vez de depender exclusivamente de um ID interno:
- **Função de Normalização Obrigatória:**
  ```typescript
  function normalizeMusicText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\(.*?\)|\[.*?\]/g, '') // Remove sufixos entre parênteses/colchetes
      .replace(/\s-\s(ao vivo|remaster.*|live.*|acoustic.*|acustico.*)$/i, '')
      .replace(/[^a-z0-9\s]/gi, '') // Remove pontuação extra
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }