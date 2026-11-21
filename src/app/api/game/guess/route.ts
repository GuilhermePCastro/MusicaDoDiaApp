import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSearchQuery } from "@/lib/utils";
import type { GuessResponse, Hint3Metadata, NextHintPayload } from "@/types/game";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, guessedSongId, attemptNumber } = body as {
      challengeId?: string;
      guessedSongId?: string;
      attemptNumber?: number;
    };

    if (
      !challengeId ||
      !guessedSongId ||
      typeof attemptNumber !== "number" ||
      !Number.isInteger(attemptNumber) ||
      attemptNumber < 1 ||
      attemptNumber > 4
    ) {
      return NextResponse.json(
        { error: "Parâmetros inválidos para validação do palpite." },
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

    const guessedSong = await prisma.song.findUnique({
      where: { id: guessedSongId },
    });

    if (!guessedSong) {
      return NextResponse.json(
        { error: "Música do palpite não encontrada." },
        { status: 404 }
      );
    }

    const targetSong = challenge.song;
    const isCorrectSong = guessedSong.id === targetSong.id;

    // 1. Caso o jogador tenha acertado a música
    if (isCorrectSong) {
      const response: GuessResponse = {
        correct: true,
        song: {
          title: targetSong.title,
          artist: targetSong.artist,
          releaseYear: targetSong.releaseYear,
          genre: targetSong.genre,
        },
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Verifica se o artista do palpite é o mesmo artista da resposta oficial
    const sameArtist =
      normalizeSearchQuery(guessedSong.artist) ===
      normalizeSearchQuery(targetSong.artist);

    // 2. Caso o jogador tenha errado na última tentativa (tentativa === 4) -> Fim de jogo
    if (attemptNumber === 4) {
      const response: GuessResponse = {
        correct: false,
        sameArtist,
        gameOver: true,
        song: {
          title: targetSong.title,
          artist: targetSong.artist,
          releaseYear: targetSong.releaseYear,
          genre: targetSong.genre,
        },
      };
      return NextResponse.json(response, { status: 200 });
    }

    // 3. Caso o jogador tenha errado e ainda tenha tentativas (attemptNumber < 4)
    // Revela apenas a próxima dica correspondente à tentativa consumida
    let nextHint: NextHintPayload;

    if (attemptNumber === 1) {
      nextHint = {
        level: 1,
        type: "lyric",
        content: challenge.hint1Lyric,
      };
    } else if (attemptNumber === 2) {
      nextHint = {
        level: 2,
        type: "lyric",
        content: challenge.hint2Lyric,
      };
    } else {
      // attemptNumber === 3 -> Libera Dica 3 (Metadados)
      nextHint = {
        level: 3,
        type: "metadata",
        content: challenge.hint3Metadata as unknown as Hint3Metadata,
      };
    }

    const response: GuessResponse = {
      correct: false,
      sameArtist,
      nextHint,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[POST /api/game/guess] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar seu palpite." },
      { status: 500 }
    );
  }
}
