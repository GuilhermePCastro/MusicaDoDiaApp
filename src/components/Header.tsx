"use client";

import React from "react";
import { Music2, BarChart3, Moon, Sun, HelpCircle } from "lucide-react";

interface HeaderProps {
  date: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenStats: () => void;
  onOpenHelp: () => void;
}

export function Header({
  date,
  darkMode,
  onToggleDarkMode,
  onOpenStats,
  onOpenHelp,
}: HeaderProps) {
  const formattedDate = React.useMemo(() => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    if (!year || !month || !day) return date;
    return `${day}/${month}/${year}`;
  }, [date]);

  return (
    <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
            <Music2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              Música do Dia
            </h1>
            {formattedDate && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Desafio #{formattedDate}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenHelp}
            title="Como jogar"
            aria-label="Como jogar"
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onOpenStats}
            title="Estatísticas e Resultado"
            aria-label="Estatísticas e Resultado"
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
            aria-label="Alternar tema"
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
