"use client";

import React from "react";
import { X, HelpCircle } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar ajuda"
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
            <HelpCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Como Jogar
            </h2>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Descubra qual é a <strong>Música do Dia</strong> a partir dos trechos da letra em até <strong>4 tentativas</strong>.
          </p>

          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">1.</span>
              <span>Você começa vendo apenas o <strong>trecho inicial</strong> da letra.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">2.</span>
              <span>A cada erro ou ao clicar em <strong>&ldquo;Pular / Pedir Dica&rdquo;</strong>, uma tentativa é consumida e uma nova dica é revelada:</span>
            </li>
          </ul>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
            <div>• <strong>Tentativa 1:</strong> Trecho inicial da letra</div>
            <div>• <strong>Tentativa 2:</strong> Libera Dica 1 (2º trecho da letra)</div>
            <div>• <strong>Tentativa 3:</strong> Libera Dica 2 (3º trecho da letra)</div>
            <div>• <strong>Tentativa 4:</strong> Libera Dica 3 (Banda/Artista, Ano e Estilo)</div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cores das Tentativas
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Verde:</strong> Você acertou a música!
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Amarelo:</strong> Artista correto, mas música errada!
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-rose-500 inline-block shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Vermelho:</strong> Música e artista incorretos ou tentativa pulada.
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
          >
            Entendi, vamos jogar!
          </button>
        </div>
      </div>
    </div>
  );
}
