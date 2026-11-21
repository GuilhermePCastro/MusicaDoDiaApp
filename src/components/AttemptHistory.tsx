"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  SkipForward,
} from "lucide-react";
import type { AttemptRecord } from "@/types/game";

interface AttemptHistoryProps {
  attempts: AttemptRecord[];
  maxAttempts: number;
}

export function AttemptHistory({ attempts, maxAttempts }: AttemptHistoryProps) {
  const slots = Array.from({ length: maxAttempts }, (_, index) => {
    return attempts[index] ?? null;
  });

  return (
    <section className="w-full space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Histórico de Tentativas
        </h2>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {attempts.length}/{maxAttempts} utilizadas
        </span>
      </div>

      <div className="space-y-2">
        {slots.map((attempt, idx) => {
          if (!attempt) {
            return (
              <div
                key={idx}
                className="h-14 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 px-4 flex items-center text-xs text-slate-400 dark:text-slate-600"
              >
                <span>Tentativa {idx + 1}</span>
              </div>
            );
          }

          if (attempt.status === "correct") {
            return (
              <div
                key={idx}
                className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 flex items-center justify-between gap-3 animate-fadeIn"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100 truncate">
                      {attempt.title}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 truncate">
                      {attempt.artist}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 shrink-0">
                  Acertou!
                </span>
              </div>
            );
          }

          if (attempt.status === "same_artist") {
            return (
              <div
                key={idx}
                className="rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex items-center justify-between gap-3 animate-fadeIn"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-amber-950 dark:text-amber-100 truncate">
                      {attempt.title}
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 truncate">
                      {attempt.artist}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-200/80 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 shrink-0">
                  Artista correto, música errada!
                </span>
              </div>
            );
          }

          if (attempt.status === "skipped") {
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 px-4 py-3 flex items-center justify-between gap-3 animate-fadeIn"
              >
                <div className="flex items-center gap-3">
                  <SkipForward className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Tentativa pulada para revelar dica
                  </span>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                  Pulou
                </span>
              </div>
            );
          }

          // status === "wrong"
          return (
            <div
              key={idx}
              className="rounded-xl border border-rose-300 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 flex items-center justify-between gap-3 animate-fadeIn"
            >
              <div className="flex items-center gap-3 min-w-0">
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-rose-950 dark:text-rose-100 truncate">
                    {attempt.title}
                  </p>
                  <p className="text-xs text-rose-700 dark:text-rose-300 truncate">
                    {attempt.artist}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 shrink-0">
                Incorreto
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
