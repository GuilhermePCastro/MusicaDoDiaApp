import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentSaoPauloDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MIN_SCHEDULED_DAYS = 5;

function safeCompareTokens(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Rota invocada pelo Vercel Cron (/api/cron/check-schedule).
 * Protegida por `Authorization: Bearer ${process.env.CRON_SECRET}`.
 * Verifica quantos desafios futuros (a partir da data atual em America/Sao_Paulo) estão agendados.
 * Caso haja menos de 5 dias agendados, envia um alerta diretamente para o Telegram via Bot API.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret || cronSecret.length === 0) {
    return NextResponse.json(
      {
        error:
          "Variável de ambiente CRON_SECRET não configurada no servidor.",
      },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expectedHeader = `Bearer ${cronSecret}`;

  if (!safeCompareTokens(authHeader, expectedHeader)) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  try {
    const todaySaoPaulo = getCurrentSaoPauloDate();

    // Busca desafios agendados de hoje em diante (formato YYYY-MM-DD permite filtro lexicográfico exato)
    // Seleciona apenas `challengeDate` para manter blindagem anti-cheat nos logs do cron.
    const upcomingChallenges = await prisma.dailyChallenge.findMany({
      where: {
        challengeDate: {
          gte: todaySaoPaulo,
        },
      },
      orderBy: {
        challengeDate: "asc",
      },
      select: {
        challengeDate: true,
      },
    });

    const remainingDays = upcomingChallenges.length;
    const lastScheduledDate =
      remainingDays > 0
        ? upcomingChallenges[remainingDays - 1].challengeDate
        : null;

    const isLowSchedule = remainingDays < MIN_SCHEDULED_DAYS;
    let telegramSent = false;

    if (isLowSchedule) {
      const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
      const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim();

      if (telegramBotToken && telegramChatId) {
        const messageHtml = [
          "🚨 <b>[Música do Dia — Alerta de Agendamento]</b>",
          "",
          `Restam apenas <b>${remainingDays} dia(s)</b> de desafios agendados no banco a partir de hoje (<code>${todaySaoPaulo}</code>).`,
          `📅 Última data agendada: <b>${lastScheduledDate ?? "Nenhuma"}</b>`,
          "",
          "Acesse o painel <code>/admin</code> ou gere um novo lote de desafios!",
        ].join("\n");

        const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

        const telegramRes = await fetch(telegramApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: messageHtml,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        });

        telegramSent = telegramRes.ok;

        if (!telegramRes.ok) {
          const errText = await telegramRes.text();
          console.error("[CRON Telegram Error]:", errText);
        }
      } else {
        console.warn(
          `[CRON check-schedule] Alerta: apenas ${remainingDays} dias agendados, mas TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não estão configurados.`
        );
      }
    }

    return NextResponse.json(
      {
        ok: true,
        todaySaoPaulo,
        remainingDays,
        threshold: MIN_SCHEDULED_DAYS,
        lastScheduledDate,
        alertTriggered: isLowSchedule,
        telegramSent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/cron/check-schedule] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao verificar agendamentos futuros." },
      { status: 500 }
    );
  }
}
