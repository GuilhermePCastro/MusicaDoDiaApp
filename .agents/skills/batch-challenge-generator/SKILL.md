---
name: batch-challenge-generator
description: Gera, valida e popula lotes de 30 desafios diários (músicas + trechos progressivos + calendário contínuo) em formato JSON e script de seed idempotente para o banco de dados.
---

# Batch Challenge Generator — Gerador de Lotes Mensais

Use esta skill sempre que o usuário solicitar a criação de um lote de músicas, um calendário mensal de desafios, um arquivo JSON de carga ou a atualização do script de `seed` para popular vários dias consecutivos de uma vez.

## 1. Regras de Curadoria e Dificuldade dos Versos (Game Design)
Para manter o jogo equilibrado e divertido, **nunca** coloque o refrão principal ou o título da música no trecho inicial:
- **`initial_lyric` (Tentativa 1 — Difícil):** Deve conter 1 a 2 versos de uma passagem menos óbvia da música. **Proibido** conter o nome da música no texto.
- **`hint_1_lyric` (Tentativa 2 — Médio):** Deve conter 1 a 2 versos do começo, continuação do verso anterior ou da ponte (*pre-chorus*) que contextualizem melhor a narrativa da música, ainda evitando entregar o refrão principal se possível.
- **`hint_2_lyric` (Tentativa 3 — Fácil):** Deve conter o refrão icônico ou os versos mais conhecidos da faixa (onde o jogador quase certamente reconhece se conhecer a música), mas se atente em manter 1 a 2 versos.
- **`hint_3_metadata` (Tentativa 4 — Metadados):** Objeto JSON contendo `{ "artist": "...", "year": 0000, "genre": "..." }`.

## 2. Regras de Diversidade e Calendário
- **Equilíbrio de Catálogo:** Misture gêneros e décadas (ex: Rock Nacional anos 80/90, MPB, Pop Internacional, Sertanejo/Pagode clássicos, Indie/Pop atual) e **nunca repita o mesmo artista em dias consecutivos**.
- **Sequência de Datas (`YYYY-MM-DD`):** Gere exatamente a quantidade de dias solicitada (padrão: 30 dias) em sequência ininterrupta a partir da data inicial informada pelo usuário (ou a partir da data atual em `America/Sao_Paulo`, caso não especificada).
- **Normalização de Busca:** Garanta que o campo `search_index` de cada música seja gerado em minúsculas, sem acentos (`normalize('NFD').replace(/[\u0300-\u036f]/g, '')`), concatenando `${title} ${artist}`.

## 3. Formato de Saída e Execução da Carga
- **Nunca crie músicas fixas (hardcoded) dentro de `prisma/seed.ts`.** O arquivo `prisma/seed.ts` é apenas o leitor genérico do JSON.
- **Sobrescrita do Lote:** Sempre que esta skill for acionada, **sobrescreva completamente** o arquivo `prisma/data/challenges-batch.json` com as novas músicas e datas solicitadas (removendo os dados do lote anterior).
- **Execução Automática:** Logo após salvar o novo `prisma/data/challenges-batch.json`, execute `npx prisma db seed` no terminal para sincronizar o banco de dados imediatamente.

## 4. Auto-Validação Antes de Finalizar
Antes de encerrar a entrega, verifique obrigatoriamente:
- [ ] Nenhuma data está duplicada ou faltando na sequência de 30 dias.
- [ ] Nenhum `initial_lyric` contém o título exato da música (case-insensitive).
- [ ] Todos os anos (`releaseYear`) são números inteiros historicamente corretos para o lançamento oficial da faixa.
- [ ] O JSON é sintaticamente válido e não possui quebras de linha não escapadas.