import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSearchQuery } from "@/lib/utils";
import type { SongSearchItem } from "@/types/game";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q") ?? "";
    const normalizedQuery = normalizeSearchQuery(rawQuery);

    if (!normalizedQuery || normalizedQuery.length < 2) {
      return NextResponse.json([], { status: 200 });
    }

    // Divide em tokens para permitir busca por múltiplos termos (ex: "legiao tempo")
    const tokens = normalizedQuery.split(" ").filter(Boolean);

    const songs = await prisma.song.findMany({
      where: {
        AND: tokens.map((token) => ({
          searchIndex: {
            contains: token,
            mode: "insensitive",
          },
        })),
      },
      select: {
        id: true,
        title: true,
        artist: true,
      },
      take: 8,
      orderBy: {
        title: "asc",
      },
    });

    const response: SongSearchItem[] = songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
    }));

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[GET /api/songs] Erro na busca:", error);
    return NextResponse.json(
      { error: "Erro ao buscar músicas." },
      { status: 500 }
    );
  }
}
