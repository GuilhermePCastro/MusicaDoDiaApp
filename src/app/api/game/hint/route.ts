import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Hint3Metadata, HintResponse } from "@/types/game";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, hintLevel } = body as {
      challengeId?: string;
      hintLevel?: number;
    };

    if (
      !challengeId ||
      typeof hintLevel !== "number" ||
      !Number.isInteger(hintLevel) ||
      hintLevel < 1 ||
      hintLevel > 4
    ) {
      return NextResponse.json(
        { error: "Parâmetros inválidos para solicitação de dica." },
        { status: 400 }
      );
    }

    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
      include: {
        song: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Desafio não encontrado." },
        { status: 404 }
      );
    }

    // Se o jogador clicou em "Pular" na 4ª e última tentativa (hintLevel === 4),
    // a partida encerra com derrota e revelamos a música correta.
    if (hintLevel === 4) {
      return NextResponse.json(
        {
          gameOver: true,
          song: {
            title: challenge.song.title,
            artist: challenge.song.artist,
            releaseYear: challenge.song.releaseYear,
            genre: challenge.song.genre,
          },
        },
        { status: 200 }
      );
    }

    let response: HintResponse;

    if (hintLevel === 1) {
      response = {
        hintLevel: 1,
        type: "lyric",
        content: challenge.hint1Lyric,
      };
    } else if (hintLevel === 2) {
      response = {
        hintLevel: 2,
        type: "lyric",
        content: challenge.hint2Lyric,
      };
    } else {
      response = {
        hintLevel: 3,
        type: "metadata",
        content: challenge.hint3Metadata as unknown as Hint3Metadata,
      };
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[POST /api/game/hint] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao liberar dica." },
      { status: 500 }
    );
  }
}
