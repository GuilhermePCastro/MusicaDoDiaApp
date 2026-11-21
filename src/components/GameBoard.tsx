"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  Trophy,
  RotateCcw,
  Shuffle,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { LyricCard } from "@/components/LyricCard";
import { SongAutocomplete } from "@/components/SongAutocomplete";
import { AttemptHistory } from "@/components/AttemptHistory";
import { EndGameModal } from "@/components/EndGameModal";
import { HelpModal } from "@/components/HelpModal";
import {
  loadDailyProgress,
  saveDailyProgress,
  loadUserStats,
  recordGameResult,
  loadThemePreference,
  saveThemePreference,
  resetDailyProgressForDev,
  clearAllLocalStorageForDev,
} from "@/lib/storage";
import type {
  AttemptRecord,
  DailyProgressState,
  GameStatus,
  GuessResponse,
  Hint3Metadata,
  HintResponse,
  RevealedHints,
  SongResultInfo,
  SongSearchItem,
  TodayChallengeResponse,
  UserStats,
} from "@/types/game";

export function GameBoard() {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "warning" | "error";
    message: string;
  } | null>(null);

  // Dados do desafio diário carregado da API
  const [challenge, setChallenge] = useState<TodayChallengeResponse | null>(
    null
  );

  // Estado da partida
  const [status, setStatus] = useState<GameStatus>("playing");
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [revealedHints, setRevealedHints] = useState<RevealedHints>({});
  const [revealedSong, setRevealedSong] = useState<SongResultInfo | undefined>(
    undefined
  );

  // Estatísticas e Modais
  const [stats, setStats] = useState<UserStats>({
    totalGames: 0,
    totalWins: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastCompletedDate: null,
    winDistribution: { 1: 0, 2: 0, 3: 0, 4: 0 },
  });
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializa preferência de tema (light mode por padrão)
  useEffect(() => {
    const savedTheme = loadThemePreference();
    const isDark = savedTheme === "dark";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      saveThemePreference(next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  // Carrega o desafio de hoje e hidrata com o progresso salvo no localStorage
  useEffect(() => {
    async function initGame() {
      setIsLoadingChallenge(true);
      setErrorMessage(null);
      try {
        const res = await fetch("/api/game/today", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error || "Não foi possível carregar o desafio de hoje."
          );
        }

        const todayChallenge = data as TodayChallengeResponse;
        setChallenge(todayChallenge);
        setStats(loadUserStats());

        // Verifica se já há progresso salvo para esta data e challengeId
        const saved = loadDailyProgress(todayChallenge.date);
        if (saved && saved.challengeId === todayChallenge.challengeId) {
          setStatus(saved.status);
          setAttempts(saved.attempts);
          setRevealedHints(saved.revealedHints);
          setRevealedSong(saved.revealedSong);

          if (saved.status !== "playing") {
            setIsStatsModalOpen(true);
          }
        } else {
          // Inicia novo estado limpo para o dia e salva
          const initialProgress: DailyProgressState = {
            challengeId: todayChallenge.challengeId,
            date: todayChallenge.date,
            status: "playing",
            attempts: [],
            revealedHints: {},
          };
          saveDailyProgress(initialProgress);
        }
      } catch (err) {
        setErrorMessage(
          (err as Error).message || "Erro ao conectar com o servidor."
        );
      } finally {
        setIsLoadingChallenge(false);
      }
    }

    initGame();
  }, []);

  // Sincroniza estado diário no localStorage
  const persistState = useCallback(
    (
      nextStatus: GameStatus,
      nextAttempts: AttemptRecord[],
      nextHints: RevealedHints,
      nextSong?: SongResultInfo
    ) => {
      if (!challenge) return;
      const state: DailyProgressState = {
        challengeId: challenge.challengeId,
        date: challenge.date,
        status: nextStatus,
        attempts: nextAttempts,
        revealedHints: nextHints,
        revealedSong: nextSong,
      };
      saveDailyProgress(state);
    },
    [challenge]
  );

  // Envia um palpite de música
  const handleGuess = async (selectedSong: SongSearchItem) => {
    if (!challenge || status !== "playing" || isSubmitting) return;

    const currentAttemptNumber = attempts.length + 1;
    setIsSubmitting(true);
    setFeedbackBanner(null);

    try {
      const res = await fetch("/api/game/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          guessedSongId: selectedSong.id,
          attemptNumber: currentAttemptNumber,
        }),
      });

      const data = (await res.json()) as GuessResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Falha ao validar palpite.");
      }

      // 1. Acertou!
      if (data.correct && data.song) {
        const newAttempt: AttemptRecord = {
          attemptNumber: currentAttemptNumber,
          songId: selectedSong.id,
          title: selectedSong.title,
          artist: selectedSong.artist,
          status: "correct",
        };
        const updatedAttempts = [...attempts, newAttempt];
        setAttempts(updatedAttempts);
        setStatus("won");
        setRevealedSong(data.song);

        persistState("won", updatedAttempts, revealedHints, data.song);
        const updatedStats = recordGameResult(
          challenge.date,
          true,
          updatedAttempts.length
        );
        setStats(updatedStats);
        setTimeout(() => setIsStatsModalOpen(true), 600);
        return;
      }

      // 2. Errou
      const attemptStatus = data.sameArtist ? "same_artist" : "wrong";
      const newAttempt: AttemptRecord = {
        attemptNumber: currentAttemptNumber,
        songId: selectedSong.id,
        title: selectedSong.title,
        artist: selectedSong.artist,
        status: attemptStatus,
      };
      const updatedAttempts = [...attempts, newAttempt];
      setAttempts(updatedAttempts);

      if (data.sameArtist) {
        setFeedbackBanner({
          type: "warning",
          message: "🎵 Artista correto, música errada! Tente outra faixa desse artista.",
        });
      }

      // Se foi a 4ª tentativa e deu gameOver
      if (data.gameOver && data.song) {
        setStatus("lost");
        setRevealedSong(data.song);
        persistState("lost", updatedAttempts, revealedHints, data.song);
        const updatedStats = recordGameResult(
          challenge.date,
          false,
          updatedAttempts.length
        );
        setStats(updatedStats);
        setTimeout(() => setIsStatsModalOpen(true), 700);
        return;
      }

      // Se ainda restam tentativas, desbloqueia a próxima dica retornada pelo servidor
      const updatedHints: RevealedHints = { ...revealedHints };
      if (data.nextHint) {
        if (data.nextHint.level === 1) {
          updatedHints.hint1Lyric = data.nextHint.content as string;
        } else if (data.nextHint.level === 2) {
          updatedHints.hint2Lyric = data.nextHint.content as string;
        } else if (data.nextHint.level === 3) {
          updatedHints.hint3Metadata = data.nextHint.content as Hint3Metadata;
        }
        setRevealedHints(updatedHints);
      }

      persistState("playing", updatedAttempts, updatedHints);
    } catch (err) {
      setFeedbackBanner({
        type: "error",
        message: (err as Error).message || "Erro ao enviar palpite.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Consome uma tentativa clicando em "Pular / Pedir Dica"
  const handleSkipAttempt = async () => {
    if (!challenge || status !== "playing" || isSubmitting) return;

    const currentAttemptNumber = attempts.length + 1;
    setIsSubmitting(true);
    setFeedbackBanner(null);

    try {
      const res = await fetch("/api/game/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          hintLevel: currentAttemptNumber,
        }),
      });

      const data = (await res.json()) as HintResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Falha ao solicitar dica.");
      }

      const skippedAttempt: AttemptRecord = {
        attemptNumber: currentAttemptNumber,
        title: "Tentativa Pulada",
        artist: "Dica desbloqueada",
        status: "skipped",
      };
      const updatedAttempts = [...attempts, skippedAttempt];
      setAttempts(updatedAttempts);

      // Se pulou na 4ª e última tentativa, fim de jogo
      if (data.gameOver && data.song) {
        setStatus("lost");
        setRevealedSong(data.song);
        persistState("lost", updatedAttempts, revealedHints, data.song);
        const updatedStats = recordGameResult(
          challenge.date,
          false,
          updatedAttempts.length
        );
        setStats(updatedStats);
        setTimeout(() => setIsStatsModalOpen(true), 500);
        return;
      }

      const updatedHints: RevealedHints = { ...revealedHints };
      if (data.hintLevel === 1) {
        updatedHints.hint1Lyric = data.content as string;
      } else if (data.hintLevel === 2) {
        updatedHints.hint2Lyric = data.content as string;
      } else if (data.hintLevel === 3) {
        updatedHints.hint3Metadata = data.content as Hint3Metadata;
      }

      setRevealedHints(updatedHints);
      persistState("playing", updatedAttempts, updatedHints);
    } catch (err) {
      setFeedbackBanner({
        type: "error",
        message: (err as Error).message || "Erro ao pular tentativa.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAttemptNumber = attempts.length + 1;
  const maxAttempts = challenge?.maxAttempts ?? 4;
  const isDevelopment = process.env.NODE_ENV === "development";
  const [isRandomizingDev, setIsRandomizingDev] = useState(false);

  // [DEBUG / DEV] Limpa o localStorage do dia atual e recarrega a página (mesma música)
  const handleDebugResetDay = () => {
    if (!challenge) return;
    resetDailyProgressForDev(challenge.date);
    window.location.reload();
  };

  // [DEBUG / DEV] Limpa TODO o localStorage (progresso de todos os dias + estatísticas/streak) e recarrega
  const handleDebugClearAllStorage = () => {
    clearAllLocalStorageForDev();
    window.location.reload();
  };

  // [DEBUG / DEV] Sorteia outra música para hoje no banco, limpa o localStorage do dia e recarrega a página
  const handleDebugRandomizeSong = async () => {
    if (!challenge || isRandomizingDev) return;
    setIsRandomizingDev(true);
    try {
      const res = await fetch("/api/game/dev-randomize", {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Não foi possível sortear outra música.");
      }
      resetDailyProgressForDev(challenge.date);
      window.location.reload();
    } catch (err) {
      setFeedbackBanner({
        type: "error",
        message: (err as Error).message || "Erro ao trocar música de teste.",
      });
      setIsRandomizingDev(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        date={challenge?.date ?? ""}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenStats={() => setIsStatsModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {isLoadingChallenge ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm font-medium">
              Carregando a Música do Dia...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto" />
            <h2 className="text-base font-bold text-rose-900 dark:text-rose-100">
              Não foi possível iniciar o jogo
            </h2>
            <p className="text-sm text-rose-700 dark:text-rose-300 max-w-md mx-auto">
              {errorMessage}
            </p>
          </div>
        ) : challenge ? (
          <>
            {/* Card Principal com os Trechos Revelados */}
            <LyricCard
              initialLyric={challenge.initialLyric}
              revealedHints={revealedHints}
              currentAttempt={
                status === "playing" ? currentAttemptNumber : attempts.length
              }
              maxAttempts={maxAttempts}
            />

            {/* Banner de Feedback (ex: Artista correto, música errada!) */}
            {feedbackBanner && (
              <div
                className={`p-3.5 rounded-xl border text-sm font-semibold flex items-center justify-between gap-2 animate-fadeIn ${
                  feedbackBanner.type === "warning"
                    ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200"
                    : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200"
                }`}
              >
                <span>{feedbackBanner.message}</span>
              </div>
            )}

            {/* Barra de Busca com Autocomplete ou Botão de Resumo se o jogo acabou */}
            {status === "playing" ? (
              <SongAutocomplete
                disabled={status !== "playing"}
                isSubmitting={isSubmitting}
                currentAttempt={currentAttemptNumber}
                maxAttempts={maxAttempts}
                onSubmitGuess={handleGuess}
                onSkipAttempt={handleSkipAttempt}
              />
            ) : (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {status === "won"
                      ? "🎉 Parabéns! Você completou o desafio de hoje."
                      : "Suas tentativas de hoje terminaram."}
                  </p>
                  {revealedSong && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Resposta:{" "}
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {revealedSong.title} — {revealedSong.artist}
                      </strong>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsStatsModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shrink-0 transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Ver Resultado & Compartilhar</span>
                </button>
              </div>
            )}

            {/* Histórico Visual das Tentativas */}
            <AttemptHistory attempts={attempts} maxAttempts={maxAttempts} />
          </>
        ) : null}
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200/60 dark:border-slate-900">
        Música do Dia • Um novo desafio todo dia à meia-noite (Horário de
        Brasília)
      </footer>

      {/* Botões discretos de Debug visíveis apenas quando NODE_ENV === 'development' */}
      {isDevelopment && challenge && (
        <div className="fixed bottom-3 right-3 z-40 flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={handleDebugResetDay}
            disabled={isRandomizingDev}
            title="[DEV] Limpar tentativas do dia atual e recarregar (Mesma música)"
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 text-[11px] font-mono flex items-center gap-1.5 opacity-60 hover:opacity-100 backdrop-blur-sm transition-all shadow-sm disabled:opacity-40"
          >
            <RotateCcw className="w-3 h-3 shrink-0" />
            <span>[DEV] Limpar Dia</span>
          </button>

          <button
            type="button"
            onClick={handleDebugRandomizeSong}
            disabled={isRandomizingDev}
            title="[DEV] Sortear outra música do banco para hoje, limpar tentativas e recarregar"
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 text-[11px] font-mono flex items-center gap-1.5 opacity-60 hover:opacity-100 backdrop-blur-sm transition-all shadow-sm disabled:opacity-40"
          >
            {isRandomizingDev ? (
              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
            ) : (
              <Shuffle className="w-3 h-3 shrink-0" />
            )}
            <span>[DEV] Trocar Música</span>
          </button>

          <button
            type="button"
            onClick={handleDebugClearAllStorage}
            disabled={isRandomizingDev}
            title="[DEV] Limpar TODO o localStorage (todos os dias, estatísticas e streak) e recarregar"
            className="w-full px-2.5 py-1.5 rounded-lg bg-rose-200/80 hover:bg-rose-300 dark:bg-rose-950/80 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800 text-[11px] font-mono flex items-center gap-1.5 opacity-60 hover:opacity-100 backdrop-blur-sm transition-all shadow-sm disabled:opacity-40"
          >
            <Trash2 className="w-3 h-3 shrink-0" />
            <span>[DEV] Limpar LocalStorage</span>
          </button>
        </div>
      )}

      {/* Modal de Fim de Jogo e Estatísticas */}
      <EndGameModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        date={challenge?.date ?? ""}
        status={status}
        attempts={attempts}
        maxAttempts={maxAttempts}
        revealedSong={revealedSong}
        stats={stats}
      />

      {/* Modal de Ajuda */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
