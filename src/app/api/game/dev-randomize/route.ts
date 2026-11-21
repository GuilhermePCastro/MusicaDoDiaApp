import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSaoPauloDate } from "@/lib/utils";

/**
 * Rota exclusiva para ambiente de desenvolvimento (NODE_ENV !== "production").
 * Sorteia outra música do catálogo para o desafio de hoje, permitindo testar várias partidas.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Rota desabilitada em ambiente de produção." },
      { status: 403 }
    );
  }

  try {
    const todayDate = getCurrentSaoPauloDate();

    // Busca todos os desafios cadastrados no seed (que possuem letras e dicas completas)
    const allChallenges = await prisma.dailyChallenge.findMany({
      orderBy: { challengeDate: "desc" },
      include: { song: true },
    });

    if (allChallenges.length < 2) {
      return NextResponse.json(
        { error: "É necessário ter pelo menos 2 desafios no banco para sortear outro." },
        { status: 400 }
      );
    }

    const todayChallenge =
      allChallenges.find((c) => c.challengeDate === todayDate) ??
      allChallenges[0];

    const candidates = allChallenges.filter(
      (c) => c.songId !== todayChallenge?.songId
    );
    const picked =
      candidates[Math.floor(Math.random() * candidates.length)] ??
      allChallenges[0];

    if (todayChallenge) {
      // Atualiza o desafio de hoje com os dados da nova música sorteada
      await prisma.dailyChallenge.update({
        where: { id: todayChallenge.id },
        data: {
          songId: picked.songId,
          initialLyric: picked.initialLyric,
          hint1Lyric: picked.hint1Lyric,
          hint2Lyric: picked.hint2Lyric,
          hint3Metadata: picked.hint3Metadata ?? {
            artist: picked.song.artist,
            year: picked.song.releaseYear,
            genre: picked.song.genre,
          },
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Nova música sorteada para o desafio de hoje (DEV).",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/game/dev-randomize] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao sortear nova música de teste." },
      { status: 500 }
    );
  }
}
