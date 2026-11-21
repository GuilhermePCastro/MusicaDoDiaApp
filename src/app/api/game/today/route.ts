import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSaoPauloDate } from "@/lib/utils";
import type { TodayChallengeResponse } from "@/types/game";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const todayDate = getCurrentSaoPauloDate();

    // Busca o desafio configurado exatamente para a data atual em America/Sao_Paulo
    let challenge = await prisma.dailyChallenge.findUnique({
      where: {
        challengeDate: todayDate,
      },
      // SEGURANÇA ANTI-CHEAT: Selecionamos APENAS id, challengeDate e initialLyric.
      // NUNCA selecionamos songId, song, hint1Lyric, hint2Lyric ou hint3Metadata.
      select: {
        id: true,
        challengeDate: true,
        initialLyric: true,
      },
    });

    // Fallback amigável para ambiente de desenvolvimento caso a data de hoje não esteja no banco:
    // pega o desafio mais recente cadastrado, mantendo o filtro estrito de campos seguros.
    if (!challenge) {
      challenge = await prisma.dailyChallenge.findFirst({
        orderBy: {
          challengeDate: "desc",
        },
        select: {
          id: true,
          challengeDate: true,
          initialLyric: true,
        },
      });
    }

    if (!challenge) {
      return NextResponse.json(
        {
          error:
            "Nenhum desafio diário encontrado no banco. Execute `npm run db:seed` para popular os desafios.",
        },
        { status: 404 }
      );
    }

    const payload: TodayChallengeResponse = {
      challengeId: challenge.id,
      date: todayDate,
      initialLyric: challenge.initialLyric,
      maxAttempts: 4,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("[GET /api/game/today] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar o desafio do dia." },
      { status: 500 }
    );
  }
}
