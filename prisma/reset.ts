import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Script seguro de limpeza de banco de dados (Skill: db-reset-manager).
 * Verifica travas de ambiente (NODE_ENV e DATABASE_URL) antes de truncar as tabelas.
 */
async function main() {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const databaseUrl = process.env.DATABASE_URL ?? "";

  console.log("🛡️  [db-reset-manager] Verificando travas de segurança de ambiente...");

  // 1. Trava de Segurança: Bloqueia se NODE_ENV === "production"
  if (nodeEnv === "production") {
    console.error(
      "❌ BLOQUEADO: O comando de reset não pode ser executado com NODE_ENV === 'production'."
    );
    process.exit(1);
  }

  // 2. Trava de Segurança: Bloqueia se a DATABASE_URL contiver indicador explícito de produção ('prod')
  if (/prod/i.test(databaseUrl) && !process.argv.includes("--force")) {
    console.error(
      "❌ BLOQUEADO: A DATABASE_URL parece apontar para um ambiente de produção (contém 'prod')."
    );
    process.exit(1);
  }

  console.log("🧹 Limpando tabelas 'daily_challenges' e 'songs' (RESTART IDENTITY CASCADE)...");

  // 3. Executa TRUNCATE preservando o schema, respeitando FKs e reiniciando sequências de ID
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "daily_challenges", "songs" RESTART IDENTITY CASCADE;'
  );

  const [remainingChallenges, remainingSongs] = await Promise.all([
    prisma.dailyChallenge.count(),
    prisma.song.count(),
  ]);

  console.log(
    `✅ Banco de dados limpo com sucesso! (daily_challenges: ${remainingChallenges}, songs: ${remainingSongs})`
  );
}

main()
  .catch((e) => {
    console.error("❌ Erro ao limpar banco de dados:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
