"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE_NAME,
  safeComparePasswords,
  verifyAdminAuth,
} from "@/lib/admin-auth";
import { normalizeSearchQuery } from "@/lib/utils";

export interface ActionFeedback {
  success: boolean;
  message: string;
}

/**
 * Autentica o administrador comparando a senha enviada com process.env.ADMIN_PASSWORD
 * e define o cookie httpOnly `lyric_admin_session`.
 */
export async function loginAdminAction(password: string): Promise<ActionFeedback> {
  const expectedPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!expectedPassword || expectedPassword.length === 0) {
    return {
      success: false,
      message:
        "A variável de ambiente ADMIN_PASSWORD não está configurada ou está vazia no servidor.",
    };
  }

  if (!password || !safeComparePasswords(password.trim(), expectedPassword)) {
    return {
      success: false,
      message: "Senha administrativa incorreta.",
    };
  }

  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, expectedPassword, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  revalidatePath("/admin");
  return {
    success: true,
    message: "Autenticado com sucesso!",
  };
}

/**
 * Encerra a sessão administrativa removendo o cookie httpOnly.
 */
export async function logoutAdminAction(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  revalidatePath("/admin");
}

/**
 * Cadastra ou atualiza uma música na tabela `songs`, gerando automaticamente o `search_index` normalizado.
 */
export async function saveSongAction(input: {
  id?: string;
  title: string;
  artist: string;
  releaseYear: number;
  genre: string;
}): Promise<ActionFeedback> {
  if (!verifyAdminAuth()) {
    return {
      success: false,
      message: "Sessão expirada ou não autorizada.",
    };
  }

  const title = input.title?.trim();
  const artist = input.artist?.trim();
  const genre = input.genre?.trim();
  const releaseYear = Number(input.releaseYear);

  if (!title || !artist || !genre || Number.isNaN(releaseYear)) {
    return {
      success: false,
      message: "Preencha todos os campos obrigatórios (Título, Artista, Ano e Estilo).",
    };
  }

  if (releaseYear < 1900 || releaseYear > new Date().getFullYear() + 1) {
    return {
      success: false,
      message: "Informe um ano de lançamento válido.",
    };
  }

  // Gera automaticamente o search_index sem acentos e em minúsculas
  const searchIndex = normalizeSearchQuery(`${title} ${artist}`);

  try {
    if (input.id) {
      const updatedSong = await prisma.song.update({
        where: { id: input.id },
        data: {
          title,
          artist,
          releaseYear,
          genre,
          searchIndex,
        },
      });

      // Sincroniza também o hint3Metadata dos desafios vinculados a esta música
      await prisma.dailyChallenge.updateMany({
        where: { songId: updatedSong.id },
        data: {
          hint3Metadata: {
            artist: updatedSong.artist,
            year: updatedSong.releaseYear,
            genre: updatedSong.genre,
          },
        },
      });

      revalidatePath("/admin");
      revalidatePath("/");
      return {
        success: true,
        message: `Música "${updatedSong.title}" atualizada com sucesso!`,
      };
    }

    const createdSong = await prisma.song.create({
      data: {
        title,
        artist,
        releaseYear,
        genre,
        searchIndex,
      },
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: `Música "${createdSong.title} — ${createdSong.artist}" cadastrada no catálogo!`,
    };
  } catch (error) {
    console.error("[saveSongAction] Erro:", error);
    return {
      success: false,
      message: "Erro ao salvar música no banco de dados.",
    };
  }
}

/**
 * Remove uma música do catálogo (e desafios associados via cascade).
 */
export async function deleteSongAction(songId: string): Promise<ActionFeedback> {
  if (!verifyAdminAuth()) {
    return {
      success: false,
      message: "Sessão expirada ou não autorizada.",
    };
  }

  if (!songId) {
    return {
      success: false,
      message: "ID da música inválido.",
    };
  }

  try {
    await prisma.song.delete({
      where: { id: songId },
    });

    revalidatePath("/admin");
    revalidatePath("/");
    return {
      success: true,
      message: "Música removida do catálogo.",
    };
  } catch (error) {
    console.error("[deleteSongAction] Erro:", error);
    return {
      success: false,
      message: "Erro ao remover música.",
    };
  }
}

/**
 * Agenda ou reagenda um desafio diário (`daily_challenges`) usando `upsert` por `challengeDate` (YYYY-MM-DD)
 * e preenchendo automaticamente `hint3Metadata` a partir da música selecionada.
 */
export async function upsertDailyChallengeAction(input: {
  challengeDate: string;
  songId: string;
  initialLyric: string;
  hint1Lyric: string;
  hint2Lyric: string;
}): Promise<ActionFeedback> {
  if (!verifyAdminAuth()) {
    return {
      success: false,
      message: "Sessão expirada ou não autorizada.",
    };
  }

  const challengeDate = input.challengeDate?.trim();
  const songId = input.songId?.trim();
  const initialLyric = input.initialLyric?.trim();
  const hint1Lyric = input.hint1Lyric?.trim();
  const hint2Lyric = input.hint2Lyric?.trim();

  // Valida formato estrito YYYY-MM-DD (America/Sao_Paulo, sem conversão UTC que desloque o dia)
  if (!challengeDate || !/^\d{4}-\d{2}-\d{2}$/.test(challengeDate)) {
    return {
      success: false,
      message: "Data inválida. Utilize o formato YYYY-MM-DD.",
    };
  }

  if (!songId || !initialLyric || !hint1Lyric || !hint2Lyric) {
    return {
      success: false,
      message:
        "Preencha a música selecionada, o trecho inicial e os trechos das Dicas 1 e 2.",
    };
  }

  try {
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return {
        success: false,
        message: "A música selecionada não existe no catálogo.",
      };
    }

    // Extrai automaticamente os metadados da música oficial para a Dica 3
    const hint3Metadata = {
      artist: song.artist,
      year: song.releaseYear,
      genre: song.genre,
    };

    await prisma.dailyChallenge.upsert({
      where: {
        challengeDate,
      },
      create: {
        challengeDate,
        songId: song.id,
        initialLyric,
        hint1Lyric,
        hint2Lyric,
        hint3Metadata,
      },
      update: {
        songId: song.id,
        initialLyric,
        hint1Lyric,
        hint2Lyric,
        hint3Metadata,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");

    return {
      success: true,
      message: `Desafio do dia ${challengeDate} agendado com "${song.title} — ${song.artist}"!`,
    };
  } catch (error) {
    console.error("[upsertDailyChallengeAction] Erro:", error);
    return {
      success: false,
      message: "Erro ao agendar desafio diário no banco de dados.",
    };
  }
}

/**
 * Exclui um agendamento de desafio diário específico.
 */
export async function deleteDailyChallengeAction(
  challengeId: string
): Promise<ActionFeedback> {
  if (!verifyAdminAuth()) {
    return {
      success: false,
      message: "Sessão expirada ou não autorizada.",
    };
  }

  if (!challengeId) {
    return {
      success: false,
      message: "ID do desafio inválido.",
    };
  }

  try {
    await prisma.dailyChallenge.delete({
      where: { id: challengeId },
    });

    revalidatePath("/admin");
    revalidatePath("/");
    return {
      success: true,
      message: "Agendamento removido com sucesso.",
    };
  } catch (error) {
    console.error("[deleteDailyChallengeAction] Erro:", error);
    return {
      success: false,
      message: "Erro ao excluir o agendamento.",
    };
  }
}
