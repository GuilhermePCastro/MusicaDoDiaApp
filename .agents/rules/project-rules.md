---
name: daily-lyric-game-architect
description: Padrões arquiteturais, regras de negócio, aprendizados e exceções para o desenvolvimento e manutenção do jogo diário "Música do Dia" (Next.js App Router, TypeScript, Tailwind CSS e Prisma/PostgreSQL).
---

# Rules do Projeto: Música do Dia

Este documento define as regras mandatórias de arquitetura, segurança, aprendizados práticos e exceções documentadas do projeto **Música do Dia**.

---

## 1. Blindagem Anti-Trapaça (Regra Zero)

- **Regra:** A rota [`GET /api/game/today`](file:///c:/Users/guibk/Desktop/MusicaDoDiaApp/src/app/api/game/today/route.ts) deve usar `select` explícito no Prisma (`id`, `challengeDate`, `initialLyric`) e retornar apenas `{ challengeId, date, initialLyric, maxAttempts }`.
- **Regra:** A validação de palpites ocorre exclusivamente no servidor em [`POST /api/game/guess`](file:///c:/Users/guibk/Desktop/MusicaDoDiaApp/src/app/api/game/guess/route.ts) comparando `guessedSong.id === challenge.song.id`.
- **Exceção (Metadados na 4ª Tentativa):** Na tentativa 4 (ou `hintLevel === 3` em [`POST /api/game/hint`](file:///c:/Users/guibk/Desktop/MusicaDoDiaApp/src/app/api/game/hint/route.ts)), o objeto `hint3Metadata` (`{ artist, year, genre }`) é liberado como dica oficial, mantendo `title` e `songId` ocultos.
- **Exceção (Feedback de Artista):** Em caso de erro na música mas acerto do artista, o back-end retorna `sameArtist: true` sem expor o título da faixa correta.
- **Exceção (Revelação no Game Over / Vitória):** O objeto completo `song: { title, artist, releaseYear, genre }` só é retornado quando `correct === true` ou quando a 4ª tentativa falha/é pulada (`gameOver: true`).
- **Aprendizado:** Nunca serializar modelos do Prisma diretamente na resposta HTTP quando `include: { song: true }` estiver ativo; mapear sempre para os tipos em [`src/types/game.ts`](file:///c:/Users/guibk/Desktop/MusicaDoDiaApp/src/types/game.ts).

---

## 2. Sincronização de Fuso Horário (`America/Sao_Paulo`)

- **Regra:** Toda verificação de data atual ([`getCurrentSaoPauloDate`](file:///c:/Users/guibk/Desktop/MusicaDoDiaApp/src/lib/utils.ts#L8-L16)) e contagem regressiva ([`getSecondsUntilSaoPauloMidnight`](file:///c:/Users/guibk/Desktop/MusicaDoDiaApp/src/lib/utils.ts#L21-L39)) deve usar explicitamente `timeZone: "America/Sao_Paulo"`.
- **Exceção (Aritmética de Dias em UTC):** É permitido usar `Date.UTC(year, month - 1, day)` para calcular offsets de dias (como em `isYesterday` ou no [`prisma/seed.ts`](file:///c:/Users/guibk/Desktop/MusicaDoDiaApp/prisma/seed.ts)) desde que `year`, `month` e `day` tenham sido extraídos previamente sob `America/Sao_Paulo`.
- **Exceção (Fallback de Desenvolvimento):** Caso não exista desafio para a data exata de hoje no banco local, `GET /api/game/today` pode buscar o registro mais recente (`orderBy: { challengeDate: "desc" }`) preservando o filtro anti-cheat.
- **Aprendizado:** O cronômetro regressivo no modal final deve extrair as horas/minutos/segundos atuais diretamente no fuso `America/Sao_Paulo` para que usuários com relógio em outro fuso continuem sincronizados com a virada à meia-noite de Brasília.

---

## 3. Normalização de Busca e Autocomplete

- **Regra:** Tanto a indexação da coluna `search_index` no banco quanto a busca em [`GET /api/songs`](file:///c:/Users/guibk/Desktop/MusicaDoDiaApp/src/app/api/songs/route.ts) devem usar [`normalizeSearchQuery`](file:///c:/Users/guibk/Desktop/MusicaDoDiaApp/src/lib/utils.ts#L56-L64) (`NFD`, remoção de diacríticos `[\u0300-\u036f]`, `lowercase`, limpeza de pontuação).
- **Regra:** Ignorar buscas com menos de **2 caracteres** (`normalizedQuery.length < 2`) e limitar o retorno a **8 itens** (`take: 8`).
- **Exceção (Busca Multi-Token):** A query normalizada é dividida em tokens combinados com `AND` no Prisma, permitindo buscar partes do título e do artista simultaneamente.
- **Aprendizado:** No componente [`SongAutocomplete`](file:///c:/Users/guibk/Desktop/MusicaDoDiaApp/src/components/SongAutocomplete.tsx), combinar debounce (`220ms`) com `AbortController` evita respostas fora de ordem durante a digitação rápida.

---

## 4. Persistência Local e Integridade de Estado

- **Regra:** O estado diário da partida é salvo no `localStorage` sob a chave `daily_lyric_state_{YYYY-MM-DD}` via [`src/lib/storage.ts`](file:///c:/Users/guibk/Desktop/MusicaDoDiaApp/src/lib/storage.ts).
- **Regra:** O tema padrão da aplicação é o **Modo Claro (Light Mode)**, com suporte completo a Dark Mode via toggle manual persistido no `localStorage`.
- **Exceção (Invalidação por Novo `challengeId`):** Se o `challengeId` salvo no `localStorage` para a data `YYYY-MM-DD` for diferente do `challengeId` retornado por `/api/game/today` (ex: após re-executar o `seed`), o cliente descarta o cache daquele dia e inicia uma nova partida.
- **Exceção (Proteção de Streak Duplicado):** `recordGameResult` ignora atualizações caso `stats.lastCompletedDate === date`, garantindo idempotência ao recarregar a página.
- **Aprendizado:** Toda leitura de `localStorage` deve ocorrer dentro de `useEffect` no cliente para evitar erros de *Hydration Mismatch* no Next.js App Router.
