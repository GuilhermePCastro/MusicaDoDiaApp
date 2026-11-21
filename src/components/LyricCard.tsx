"use client";

import React from "react";
import { Quote, Lock, Disc3, Calendar, Sparkles, User } from "lucide-react";
import type { RevealedHints } from "@/types/game";

interface LyricCardProps {
  initialLyric: string;
  revealedHints: RevealedHints;
  currentAttempt: number;
  maxAttempts: number;
}

export function LyricCard({
  initialLyric,
  revealedHints,
  currentAttempt,
  maxAttempts,
}: LyricCardProps) {
  return (
    <section className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      {/* Cabeçalho do Card */}
      <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
          <Quote className="w-4 h-4" />
          <span>Trechos da Letra & Dicas</span>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
          Tentativa {Math.min(currentAttempt, maxAttempts)} de {maxAttempts}
        </span>
      </div>

      {/* Corpo com Versos e Dicas Progressivas */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Trecho Inicial (Sempre visível na Tentativa 1) */}
        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5">
            1º Trecho (Inicial)
          </div>
          <p className="text-lg sm:text-xl font-serif italic text-slate-800 dark:text-slate-100 leading-relaxed">
            “{initialLyric}”
          </p>
        </div>

        {/* Dica 1: 2º trecho da letra (Desbloqueado na Tentativa 2) */}
        {revealedHints.hint1Lyric ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 animate-fadeIn">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
              Dica 1 • 2º Trecho da Letra
            </div>
            <p className="text-lg sm:text-xl font-serif italic text-slate-800 dark:text-slate-100 leading-relaxed">
              “{revealedHints.hint1Lyric}”
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-slate-400 dark:text-slate-500 text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Dica 1 (2º trecho da letra) — liberada na 2ª tentativa</span>
          </div>
        )}

        {/* Dica 2: 3º trecho da letra (Desbloqueado na Tentativa 3) */}
        {revealedHints.hint2Lyric ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 animate-fadeIn">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
              Dica 2 • 3º Trecho da Letra
            </div>
            <p className="text-lg sm:text-xl font-serif italic text-slate-800 dark:text-slate-100 leading-relaxed">
              “{revealedHints.hint2Lyric}”
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-slate-400 dark:text-slate-500 text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Dica 2 (3º trecho da letra) — liberada na 3ª tentativa</span>
          </div>
        )}

        {/* Dica 3: Metadados (Artista, Ano e Estilo Musical - Desbloqueado na Tentativa 4) */}
        {revealedHints.hint3Metadata ? (
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/60 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dica Final • Informações da Música</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-amber-200/70 dark:border-amber-900/50 flex items-center gap-2.5">
                <User className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Banda / Artista
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {revealedHints.hint3Metadata.artist}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-amber-200/70 dark:border-amber-900/50 flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Lançamento
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {revealedHints.hint3Metadata.year}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-amber-200/70 dark:border-amber-900/50 flex items-center gap-2.5">
                <Disc3 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Estilo Musical
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {revealedHints.hint3Metadata.genre}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-slate-400 dark:text-slate-500 text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              Dica 3 (Artista, Ano e Estilo) — liberada na 4ª tentativa
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
