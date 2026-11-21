# 🎵 Música do Dia

Um jogo web diário de adivinhação de músicas brasileiras e internacionais pelos trechos da letra (estilo *Wordle* / *Lyricle*), construído com **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** e **PostgreSQL (Prisma ORM)**.

---

## ✨ Mecânica do Jogo e Funcionalidades

- **Desafio Diário Único (`America/Sao_Paulo`):** Uma nova música todo dia à meia-noite no horário de Brasília.
- **4 Tentativas com Dicas Progressivas:**
  - **1ª Tentativa:** Exibe apenas o trecho inicial da letra (`initial_lyric`).
  - **2ª Tentativa:** Desbloqueia a **Dica 1** (2º trecho da letra).
  - **3ª Tentativa:** Desbloqueia a **Dica 2** (3º trecho da letra / refrão).
  - **4ª Tentativa:** Desbloqueia a **Dica 3** (Metadados da faixa: **Banda/Artista**, **Ano de Lançamento** e **Estilo Musical**).
- **Feedback Visual Inteligente:**
  - 🟩 **Verde:** Acertou a música!
  - 🟨 **Amarelo:** *"Artista correto, música errada!"* — indica que o palpite pertence ao mesmo artista/banda da música do dia.
  - 🟥 **Vermelho:** Música e artista incorretos ou tentativa pulada.
- **Busca com Autocomplete Tolerante a Acentos:** Busca indexada e normalizada (`NFD` + `lowercase`) com debounce, cancelamento de requisições (`AbortController`) e navegação completa por teclado (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
- **Blindagem Anti-Cheat (Server-Side):**
  - A rota inicial (`GET /api/game/today`) retorna **exclusivamente** `{ challengeId, date, initialLyric, maxAttempts }`.
  - O `songId`, o título da resposta e as dicas futuras jamais são enviados ao cliente antes do desbloqueio no servidor.
- **Persistência Local e Estatísticas:**
  - Progresso diário salvo no `localStorage` sob a chave `daily_lyric_state_{YYYY-MM-DD}`.
  - Histórico de estatísticas (Total de Jogos, % de Vitórias, Sequência Atual / *Streak* e Recorde).
  - Compartilhamento de resultado formatado com emojis (sem spoilers) e cronômetro regressivo até a meia-noite de Brasília.
- **Tema Claro / Escuro:** Modo claro (*Light Mode*) como padrão inicial e alternância manual para *Dark Mode* persistida localmente.
- **Painel Administrativo (`/admin`):**
  - Protegido por senha via variável de ambiente (`ADMIN_PASSWORD`) e sessão em cookie `httpOnly` (`lyric_admin_session`) com comparação em tempo constante (`crypto.timingSafeEqual`).
  - Gerenciamento completo do catálogo de músicas (`songs`) e agendamento/reagendamento de desafios diários (`daily_challenges`) via **Next.js Server Actions**.
- **Ferramentas Discretas de Debug em Desenvolvimento (`NODE_ENV === 'development'`):**
  - Botões flutuantes no canto inferior direito para **`[DEV] Limpar Dia`**, **`[DEV] Trocar Música`** e **`[DEV] Limpar LocalStorage`**.

---

## 🛠️ Stack Tecnológica

- **Front-end & Back-end:** [Next.js 14](https://nextjs.org/) (App Router, Route Handlers & Server Actions)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) + ícones [Lucide React](https://lucide.dev/)
- **Banco de Dados & ORM:** [PostgreSQL](https://www.postgresql.org/) (compatível com Supabase Transaction/Session Pooler) + [Prisma ORM](https://www.prisma.io/)

---

## 📂 Estrutura de Diretórios

```text
MusicaDoDiaApp/
├── .agents/
│   ├── rules/
│   │   └── project-rules.md             # Regras arquiteturais, aprendizados e exceções
│   └── skills/
│       ├── admin-challenge-manager/     # Skill de gestão e auditoria da rota /admin
│       ├── batch-challenge-generator/   # Skill geradora de lotes de 30 dias de desafios
│       ├── db-reset-manager/            # Skill de limpeza segura do banco para testes
│       └── qa-gatekeeper/               # Skill de auditoria anti-cheat, timezone e UX
├── prisma/
│   ├── data/
│   │   └── challenges-batch.json        # Lote JSON com os desafios diários agendados
│   ├── reset.ts                         # Script seguro de limpeza das tabelas (DEV)
│   ├── schema.prisma                    # Schema do Prisma (Song e DailyChallenge)
│   └── seed.ts                          # Leitor genérico e idempotente do lote JSON
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── actions.ts               # Server Actions do painel administrativo
│   │   │   └── page.tsx                 # Página /admin protegida por cookie httpOnly
│   │   ├── api/
│   │   │   ├── game/
│   │   │   │   ├── dev-randomize/       # POST /api/game/dev-randomize (Apenas DEV)
│   │   │   │   ├── guess/route.ts       # POST /api/game/guess (Validação de palpite)
│   │   │   │   ├── hint/route.ts        # POST /api/game/hint (Pular / pedir dica)
│   │   │   │   └── today/route.ts       # GET /api/game/today (Desafio atual sem spoilers)
│   │   │   └── songs/route.ts           # GET /api/songs?q=... (Autocomplete máx. 8 itens)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx       # Interface de agendamento e catálogo de músicas
│   │   │   └── AdminLoginForm.tsx       # Tela de login administrativo
│   │   ├── AttemptHistory.tsx           # Slots visuais das 4 tentativas
│   │   ├── EndGameModal.tsx             # Modal final com estatísticas, share e cronômetro
│   │   ├── GameBoard.tsx                # Orquestrador principal do jogo
│   │   ├── Header.tsx                   # Cabeçalho com data, ajuda, stats e tema
│   │   ├── HelpModal.tsx                # Modal "Como Jogar"
│   │   ├── LyricCard.tsx                # Card central de versos e dicas progressivas
│   │   └── SongAutocomplete.tsx         # Input de busca com dropdown de sugestões
│   ├── lib/
│   │   ├── admin-auth.ts                # Validação de sessão administrativa
│   │   ├── prisma.ts                    # Instância singleton do PrismaClient
│   │   ├── storage.ts                   # Persistência no localStorage
│   │   └── utils.ts                     # Timezone America/Sao_Paulo e normalização NFD
│   └── types/
│       └── game.ts                      # Interfaces e DTOs TypeScript
├── .env.example
├── GEMINI.md
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Como Configurar e Rodar Localmente

### 1. Pré-requisitos
- **Node.js** 18+ instalado
- Um banco de dados **PostgreSQL** (local ou em nuvem, como **Supabase**, **Neon** ou **Railway**)

### 2. Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha as variáveis no seu arquivo `.env`:

```env
# Conexão PostgreSQL para queries da aplicação (No Supabase, pode usar a porta 6543 com ?pgbouncer=true)
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:6543/postgres?pgbouncer=true"

# Conexão direta / Session Pooler para migrations e db push do Prisma (Porta 5432)
DIRECT_URL="postgresql://USUARIO:SENHA@HOST:5432/postgres"

# Senha para acessar o painel administrativo em /admin
ADMIN_PASSWORD="sua_senha_administrativa_segura"
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Criar as Tabelas e Popular o Banco de Dados

```bash
# Sincroniza o schema do Prisma com o banco PostgreSQL
npm run db:push

# Popula o banco com o lote de desafios diários (prisma/data/challenges-batch.json)
npm run db:seed
```

### 5. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

- **Jogo Principal:** Acesse [`http://localhost:3000`](http://localhost:3000)
- **Painel Administrativo:** Acesse [`http://localhost:3000/admin`](http://localhost:3000/admin)

---

## 📜 Scripts Disponíveis (`package.json`)

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento Next.js em `http://localhost:3000`. |
| `npm run build` | Gera o cliente Prisma e compila a aplicação para produção. |
| `npm run start` | Inicia o servidor Next.js compilado em modo de produção. |
| `npm run db:push` | Sincroniza o schema `prisma/schema.prisma` com o PostgreSQL. |
| `npm run db:seed` | Carrega de forma idempotente os desafios de `prisma/data/challenges-batch.json`. |
| `npm run db:reset` | **(Apenas DEV)** Limpa com segurança as tabelas `daily_challenges` e `songs` (`TRUNCATE ... RESTART IDENTITY CASCADE`). |

---

## 🔌 Documentação Resumida da API

### `GET /api/game/today`
Identifica a data atual em `America/Sao_Paulo` e retorna o desafio do dia sem expor a resposta:
```json
{
  "challengeId": "cm...",
  "date": "2026-11-21",
  "initialLyric": "Quando a gente ama / Qualquer coisa serve para relembrar",
  "maxAttempts": 4
}
```

### `GET /api/songs?q={termo}`
Busca músicas na coluna normalizada `search_index` (mínimo de 2 caracteres, máximo de 8 resultados):
```json
[
  {
    "id": "cm...",
    "title": "Fio de Cabelo",
    "artist": "Chitãozinho & Xororó"
  }
]
```

### `POST /api/game/guess`
Recebe `{ challengeId, guessedSongId, attemptNumber }` (onde `attemptNumber` é um inteiro de `1` a `4`) e valida no servidor:
- **Em caso de acerto:** `{ "correct": true, "song": { "title": "...", "artist": "...", "releaseYear": 1982, "genre": "..." } }`
- **Em caso de erro (`attemptNumber < 4`):** `{ "correct": false, "sameArtist": false, "nextHint": { "level": 1, "type": "lyric", "content": "..." } }`
- **Em caso de erro na última tentativa (`attemptNumber === 4`):** `{ "correct": false, "sameArtist": false, "gameOver": true, "song": { ... } }`

### `POST /api/game/hint`
Recebe `{ challengeId, hintLevel }` ao clicar no botão **"Pular / Pedir Dica"** e retorna apenas a dica correspondente ao nível atual (ou encerra o jogo revelando a música caso `hintLevel === 4`).
