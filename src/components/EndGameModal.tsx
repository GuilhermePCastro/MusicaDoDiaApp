"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Trophy,
  Frown,
  Share2,
  Check,
  Clock,
  Disc3,
  Flame,
  Award,
} from "lucide-react";
import {
  formatCountdown,
  getSecondsUntilSaoPauloMidnight,
} from "@/lib/utils";
import type {
  AttemptRecord,
  GameStatus,
  SongResultInfo,
  UserStats,
} from "@/types/game";

interface EndGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  status: GameStatus;
  attempts: AttemptRecord[];
  maxAttempts: number;
  revealedSong?: SongResultInfo;
  stats: UserStats;
}

export function EndGameModal({
  isOpen,
  onClose,
  date,
  status,
  attempts,
  maxAttempts,
  revealedSong,
  stats,
}: EndGameModalProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    getSecondsUntilSaoPauloMidnight()
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(getSecondsUntilSaoPauloMidnight());

    const interval = setInterval(() => {
      setSecondsLeft(getSecondsUntilSaoPauloMidnight());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const generateShareText = (): string => {
    const score = status === "won" ? `${attempts.length}/${maxAttempts}` : `X/${maxAttempts}`;
    const emojiRow = Array.from({ length: maxAttempts }, (_, idx) => {
      const att = attempts[idx];
      if (!att) return "⬜";
      if (att.status === "correct") return "🟩";
      if (att.status === "same_artist") return "🟨";
      return "🟥";
    }).join("");

    return `🎵 Música do Dia (${date}) - ${score}\n\n${emojiRow}\n\nJogue também!`;
  };

  const handleShare = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("Erro ao copiar para a área de transferência:", e);
    }
  };

  const winPercentage =
    stats.totalGames > 0
      ? Math.round((stats.totalWins / stats.totalGames) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">
          {/* Cabeçalho de Status */}
          {status === "won" && (
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Trophy className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Você acertou! 🎉
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Descobriu a música na{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {attempts.length}ª tentativa
                </strong>
                .
              </p>
            </div>
          )}

          {status === "lost" && (
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <Frown className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Fim de Jogo!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Suas {maxAttempts} tentativas acabaram hoje.
              </p>
            </div>
          )}

          {status === "playing" && (
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Suas Estatísticas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Continue jogando para descobrir a Música do Dia!
              </p>
            </div>
          )}

          {/* Resposta Oficial Revelada (apenas quando o jogo terminou) */}
          {status !== "playing" && revealedSong && (
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/70 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Disc3 className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Música do Dia
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {revealedSong.title}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                  {revealedSong.artist} • {revealedSong.releaseYear} •{" "}
                  {revealedSong.genre}
                </div>
              </div>
            </div>
          )}

          {/* Grade de Estatísticas */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.totalGames}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Jogos
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {winPercentage}%
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Vitórias
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5">
                <Flame className="w-4 h-4" />
                {stats.currentStreak}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Sequência
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-0.5">
                <Award className="w-4 h-4" />
                {stats.maxStreak}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Recorde
              </div>
            </div>
          </div>

          {/* Resumo Visual e Compartilhamento (quando finalizado) */}
          {status !== "playing" && (
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-medium">
                    Próxima música (Brasília):
                  </span>
                </div>
                <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                  {formatCountdown(secondsLeft)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado para a área de transferência!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Compartilhar Resultado (Sem Spoilers)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
