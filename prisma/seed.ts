import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function normalizeSearchIndex(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface BatchItem {
  challengeDate: string;
  title: string;
  artist: string;
  releaseYear: number;
  genre: string;
  initialLyric: string;
  hint1Lyric: string;
  hint2Lyric: string;
}

async function main() {
  const filePath = path.join(process.cwd(), 'prisma', 'data', 'challenges-batch.json');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}. Rode a skill batch-challenge-generator primeiro.`);
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const batch: BatchItem[] = JSON.parse(rawData);

  console.log(`Carregando ${batch.length} desafios do JSON...`);

  for (const item of batch) {
    const searchIndex = normalizeSearchIndex(`${item.title} ${item.artist}`);

    // 1. Busca se a música já existe no catálogo para evitar duplicação
    let song = await prisma.song.findFirst({
      where: {
        title: item.title,
        artist: item.artist,
      },
    });

    if (!song) {
      song = await prisma.song.create({
        data: {
          title: item.title,
          artist: item.artist,
          releaseYear: item.releaseYear,
          genre: item.genre,
          searchIndex,
        },
      });
    }

    // 2. Agenda ou atualiza o desafio na data exata (YYYY-MM-DD em String conforme schema.prisma)
    const challengeDate = item.challengeDate;

    await prisma.dailyChallenge.upsert({
      where: { challengeDate },
      update: {
        songId: song.id,
        initialLyric: item.initialLyric,
        hint1Lyric: item.hint1Lyric,
        hint2Lyric: item.hint2Lyric,
        hint3Metadata: {
          artist: song.artist,
          year: song.releaseYear,
          genre: song.genre,
        },
      },
      create: {
        challengeDate,
        songId: song.id,
        initialLyric: item.initialLyric,
        hint1Lyric: item.hint1Lyric,
        hint2Lyric: item.hint2Lyric,
        hint3Metadata: {
          artist: song.artist,
          year: song.releaseYear,
          genre: song.genre,
        },
      },
    });
  }

  console.log('Carga concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });