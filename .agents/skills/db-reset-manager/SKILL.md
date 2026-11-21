---
name: db-reset-manager
description: Limpa de forma segura e controlada as tabelas do banco de dados (daily_challenges, songs e daily_stats) em ambiente de desenvolvimento/teste, reiniciando sequências de ID para permitir novos testes e cargas de seed.
---

# Database Reset Manager — Limpeza Segura para Testes

Use esta skill sempre que o usuário solicitar limpar, zerar, resetar ou apagar os dados do banco de dados para realizar novos testes ou preparar uma nova carga com a skill `batch-challenge-generator`.

## 1. Trava de Segurança de Ambiente (Bloqueio Crítico)
Antes de executar qualquer comando destrutivo (`TRUNCATE`, `DELETE` ou `prisma migrate reset`):
- **Verifique a variável `NODE_ENV` e a `DATABASE_URL`:** Nunca execute limpeza se `NODE_ENV === 'production'` ou se o host da `DATABASE_URL` indicar explicitamente um ambiente de produção (ex: contendo `prod` no nome do banco/host), a menos que o usuário confirme expressamente após um aviso explícito.
- **Preservação de Schema:** Prefira limpar apenas os dados das tabelas (`TRUNCATE` ou `deleteMany`) mantendo a estrutura das tabelas intacta, evitando ter que rodar migrações novamente, exceto se o usuário pedir explicitamente um reset de schema.

## 2. Ordem de Limpeza e Reinício de Sequências
Para respeitar as restrições de chave estrangeira (*Foreign Keys*) e zerar os IDs autoincrementais:
1. Limpe primeiro as tabelas dependentes: `daily_challenges` e `daily_stats` (se existir).
2. Limpe por último a tabela mestre: `songs`.
3. Sempre reinicie as sequências de ID (`RESTART IDENTITY` no PostgreSQL) para que os próximos registros comecem novamente do `id = 1`.

### Padrões de Execução por Ferramenta:
- **Via Prisma (Script TS/Node):**
  ```typescript
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "daily_challenges", "songs" RESTART IDENTITY CASCADE;'
  );