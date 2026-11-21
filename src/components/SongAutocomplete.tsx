"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, SkipForward, Send, Music } from "lucide-react";
import type { SongSearchItem } from "@/types/game";

interface SongAutocompleteProps {
  disabled: boolean;
  isSubmitting: boolean;
  currentAttempt: number;
  maxAttempts: number;
  onSubmitGuess: (song: SongSearchItem) => void;
  onSkipAttempt: () => void;
}

export function SongAutocomplete({
  disabled,
  isSubmitting,
  currentAttempt,
  maxAttempts,
  onSubmitGuess,
  onSkipAttempt,
}: SongAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SongSearchItem[]>([]);
  const [selectedSong, setSelectedSong] = useState<SongSearchItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Busca com debounce na API /api/songs?q=...
  useEffect(() => {
    if (selectedSong && query === `${selectedSong.title} — ${selectedSong.artist}`) {
      setIsOpen(false);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/songs?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Falha na busca");
        const data = (await res.json()) as SongSearchItem[];
        setResults(data);
        setIsOpen(true);
        setHighlightedIndex(data.length > 0 ? 0 : -1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Erro ao buscar músicas:", err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedSong]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSong = (song: SongSearchItem) => {
    setSelectedSong(song);
    setQuery(`${song.title} — ${song.artist}`);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleConfirmGuess = () => {
    if (!selectedSong || disabled || isSubmitting) return;
    onSubmitGuess(selectedSong);
    setSelectedSong(null);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && results.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }
      setHighlightedIndex((prev) =>
        results.length > 0 ? (prev + 1) % results.length : -1
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : -1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && results[highlightedIndex]) {
        handleSelectSong(results[highlightedIndex]);
      } else if (selectedSong) {
        handleConfirmGuess();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const skipButtonText =
    currentAttempt < maxAttempts
      ? `Pular / Pedir Dica (${currentAttempt}/${maxAttempts})`
      : "Desistir e Ver Resposta";

  return (
    <div ref={containerRef} className="w-full space-y-3">
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            disabled={disabled || isSubmitting}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedSong(null);
            }}
            onFocus={() => {
              if (results.length > 0 && !selectedSong) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Digite o nome da música ou artista..."
            aria-label="Buscar música ou artista"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm disabled:opacity-60 transition-all text-sm sm:text-base"
          />
          {isLoading && (
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin absolute right-3.5" />
          )}
        </div>

        {/* Dropdown de Autocomplete */}
        {isOpen && (
          <div
            role="listbox"
            className="absolute z-20 mt-1.5 w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
          >
            {results.length === 0 && !isLoading ? (
              <div className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400 text-center">
                Nenhuma música encontrada para &ldquo;{query}&rdquo;
              </div>
            ) : (
              results.map((song, idx) => {
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={song.id}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectSong(song)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      isHighlighted
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">
                        {song.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {song.artist}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={handleConfirmGuess}
          disabled={!selectedSong || disabled || isSubmitting}
          className="flex-1 py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm sm:text-base shadow-sm shadow-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Enviar Palpite</span>
        </button>

        <button
          type="button"
          onClick={onSkipAttempt}
          disabled={disabled || isSubmitting}
          className="py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 transition-all"
        >
          <SkipForward className="w-4 h-4" />
          <span>{skipButtonText}</span>
        </button>
      </div>
    </div>
  );
}
