---
name: daily-lyric-game-architect
description: Padrões arquiteturais, regras de negócio, aprendizados e exceções para o desenvolvimento e manutenção do jogo diário "Música do Dia" (Next.js App Router, TypeScript, Tailwind CSS e Prisma/PostgreSQL).
---

# Diretrizes do Projeto: Música do Dia (Jogo Diário de Letras)

Sempre que criar, alterar ou revisar código neste repositório, siga rigorosamente estas regras, aprendizados e exceções:

---

## 1. Blindagem Anti-Trapaça (Regra Zero)

### Regras Obrigatórias
- **Isolamento do Payload Inicial (`GET /api/game/today`):** Utilize obrigatoriamente `select: { id: true, challengeDate: true, initialLyric: true }` no Prisma. Nunca exponha `songId`, dados da relação `song` (`title`, `artist`, `releaseYear`, `genre`) ou dicas futuras (`hint1Lyric`, `hint2Lyric`, `hint3Metadata`) antes do desbloqueio.
- **Validação Estrita no Servidor (`POST /api/game/guess`):** A verificação de acerto deve ocorrer exclusivamente no back-end comparando IDs (`guessedSong.id === challenge.song.id`). O front-end jamais deve receber o ID correto para validar localmente.
- **Entrega Progressiva de Dicas:** Cada requisição de erro (`attemptNumber < 4`) ou pulo (`POST /api/game/hint`) deve retornar **apenas** a dica correspondente ao nível atual (`1`, `2` ou `3`), nunca um array com todas as dicas.

### Exceções Permitidas
- **Exceção 1 (Dica de Nível 3 - Metadados):** Na tentativa 4 (ou ao pedir a `hintLevel === 3`), é permitido revelar `hint3Metadata` contendo `{ artist, year, genre }` mesmo com a partida ainda em andamento (`status === "playing"`), pois esta é a mecânica oficial da 4ª tentativa. O `title` e o `songId` continuam estritamente ocultos.
- **Exceção 2 (Feedback de Mesmo Artista):** Quando o jogador erra a música mas acerta o artista (`sameArtist: true`), o servidor pode confirmar esse fato booleano na resposta sem revelar o título da música correta.
- **Exceção 3 (Fim de Partida - Vitória ou Derrota):** Os metadados completos da música oficial (`song: { title, artist, releaseYear, genre }`) só podem ser enviados no payload quando `correct === true` OU quando a 4ª tentativa é consumida (`attemptNumber === 4` / `hintLevel === 4` -> `gameOver: true`).

### Aprendizados
- **Cuidado com `include: { song: true }` no Prisma:** Nunca retorne diretamente o objeto do Prisma para o `NextResponse.json()`. Sempre mapeie explicitamente os campos para interfaces DTO (`TodayChallengeResponse`, `GuessResponse`, `HintResponse`) para evitar vazamento acidental de chaves estrangeiras (`songId`).

---

## 2. Sincronização de Fuso Horário (`America/Sao_Paulo`)

### Regras Obrigatórias
- Todas as operações para determinar o desafio de hoje (`getCurrentSaoPauloDate`) e a contagem regressiva até a próxima música (`getSecondsUntilSaoPauloMidnight`) devem forçar explicitamente `timeZone: "America/Sao_Paulo"` via `Intl.DateTimeFormat`.
- Nunca utilize `new Date().toISOString().split("T")[0]` diretamente para consultar a data atual no servidor, pois o UTC vira o dia às 21h00 no horário de Brasília.

### Exceções Permitidas
- **Exceção 1 (Cálculo de Offset em UTC após Extração):** Ao calcular diferenças de dias (como em `isYesterday` para sequência de vitórias/streak ou geração de datas no `seed.ts`), é permitido usar `Date.UTC(year, month - 1, day)` **desde que** as variáveis `year`, `month` e `day` já tenham sido extraídas previamente no fuso `America/Sao_Paulo`.
- **Exceção 2 (Fallback em Ambiente de Desenvolvimento):** Se a rota `GET /api/game/today` não encontrar um desafio cadastrado para a data exata de hoje em `America/Sao_Paulo`, é permitido fazer fallback para o desafio mais recente (`orderBy: { challengeDate: "desc" }`) para não quebrar o ambiente local de desenvolvimento, mantendo a seleção restrita de campos anti-cheat.

### Aprendizados
- **Cronômetro no Cliente:** O cálculo do contador regressivo até a meia-noite não pode depender do fuso configurado no sistema operacional do jogador. Extrair `hour`, `minute` e `second` com `Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour12: false })` garante que jogadores em qualquer fuso vejam a virada exatamente à meia-noite de Brasília.

---

## 3. Normalização de Busca e Autocomplete (`GET /api/songs`)

### Regras Obrigatórias
- Toda inserção ou atualização na tabela `songs` (incluindo o `prisma/seed.ts`) deve preencher `search_index` usando normalização canônica: `.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()`, concatenando `${title} ${artist}`.
- A rota `GET /api/songs?q=...` deve aplicar exatamente a mesma função `normalizeSearchQuery` no parâmetro recebido, exigir no mínimo **2 caracteres** (`normalizedQuery.length >= 2`) e limitar o retorno a no máximo **8 resultados** (`take: 8`).

### Exceções Permitidas
- **Exceção 1 (Comparação de `sameArtist`):** A função `normalizeSearchQuery` também deve ser reutilizada no back-end ao comparar `guessedSong.artist` com `targetSong.artist` para evitar falsos negativos por diferenças de acentuação ou caixa alta/baixa.
- **Exceção 2 (Busca Multi-Token):** A query normalizada pode ser dividida em tokens (`.split(" ")`) combinados com cláusula `AND` e `contains` no Prisma, permitindo encontrar `"Legião Urbana - Tempo Perdido"` ao digitar `"legiao tempo"`.

### Aprendizados
- **Prevenção de Race Conditions no Front-end:** O componente `SongAutocomplete` deve sempre utilizar debounce (`~220ms`) aliado a um `AbortController` no `useEffect`, cancelando requisições pendentes caso o usuário continue digitando rapidamente.

---

## 4. Gerenciamento de Estado, Persistência e UI/UX

### Regras Obrigatórias
- **Chave Canônica de Estado Diário:** O estado da partida em andamento não exige autenticação e deve ser persistido no `localStorage` sob a chave estrita `daily_lyric_state_{YYYY-MM-DD}`.
- **Estatísticas e Tema:** As estatísticas históricas (`totalGames`, `totalWins`, `currentStreak`, `maxStreak`, `lastCompletedDate`, `winDistribution`) e a preferência de tema (`light` como padrão inicial, `dark` opcional via classe `.dark` no `<html>`) devem ser salvas em chaves separadas no `localStorage`.
- **Trava contra Duplo Clique:** Enquanto uma requisição a `/api/game/guess` ou `/api/game/hint` estiver em voo (`isSubmitting === true`) ou quando `status !== "playing"`, os botões de enviar palpite e pular tentativa devem permanecer obrigatoriamente desabilitados (`disabled`).
- **Compartilhamento Zero-Spoiler:** O texto copiado no botão de compartilhamento deve exibir apenas a data, pontuação (`X/4` ou `1..4/4`) e a linha de emojis (`🟩`, `🟨`, `🟥`, `⬜`), sem jamais incluir o título da música ou nome do artista.

### Exceções Permitidas
- **Exceção 1 (Reset por Mudança de `challengeId`):** Caso o administrador altere o desafio do dia no banco de dados (ou o `seed` seja rodado novamente no mesmo dia gerando um novo `challengeId` para a mesma data `YYYY-MM-DD`), o front-end tem permissão para descartar o `daily_lyric_state_{YYYY-MM-DD}` antigo cujo `challengeId` divirja do retornado pela API e iniciar uma partida limpa.
- **Exceção 2 (Idempotência de Estatísticas):** A função `recordGameResult` deve verificar `if (stats.lastCompletedDate === date) return stats;` para garantir que recarregamentos de página ou reaberturas do modal nunca contabilizem duas vitórias ou duas partidas no mesmo dia.

### Aprendizados
- **Prevenção de Hydration Mismatch no Next.js App Router:** Nunca leia `window.localStorage` diretamente na inicialização de estado renderizada no servidor. Faça toda a leitura e hidratação do progresso diário e do tema escuro dentro de `useEffect` no cliente e utilize `suppressHydrationWarning` na tag `<html>` do `layout.tsx`.
