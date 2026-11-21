"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Music2,
  Calendar,
  Plus,
  Save,
  Trash2,
  Edit3,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import {
  logoutAdminAction,
  saveSongAction,
  deleteSongAction,
  upsertDailyChallengeAction,
  deleteDailyChallengeAction,
  type ActionFeedback,
} from "@/app/admin/actions";

export interface AdminSongItem {
  id: string;
  title: string;
  artist: string;
  releaseYear: number;
  genre: string;
  searchIndex: string;
}

export interface AdminChallengeItem {
  id: string;
  challengeDate: string;
  songId: string;
  initialLyric: string;
  hint1Lyric: string;
  hint2Lyric: string;
  song: {
    id: string;
    title: string;
    artist: string;
    releaseYear: number;
    genre: string;
  };
}

interface AdminDashboardProps {
  todaySaoPaulo: string;
  songs: AdminSongItem[];
  challenges: AdminChallengeItem[];
}

export function AdminDashboard({
  todaySaoPaulo,
  songs,
  challenges,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"challenges" | "songs">(
    "challenges"
  );

  // Estado do formulário de Agendamento de Desafio Diário
  const [challengeDate, setChallengeDate] = useState(todaySaoPaulo);
  const [selectedSongId, setSelectedSongId] = useState(songs[0]?.id ?? "");
  const [initialLyric, setInitialLyric] = useState("");
  const [hint1Lyric, setHint1Lyric] = useState("");
  const [hint2Lyric, setHint2Lyric] = useState("");
  const [challengeFeedback, setChallengeFeedback] =
    useState<ActionFeedback | null>(null);

  // Estado do formulário de Cadastro/Edição de Música
  const [editingSongId, setEditingSongId] = useState<string | undefined>(
    undefined
  );
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songYear, setSongYear] = useState<number>(new Date().getFullYear());
  const [songGenre, setSongGenre] = useState("");
  const [songSearchFilter, setSongSearchFilter] = useState("");
  const [songFeedback, setSongFeedback] = useState<ActionFeedback | null>(null);

  const [isPendingChallenge, startChallengeTransition] = useTransition();
  const [isPendingSong, startSongTransition] = useTransition();
  const [isPendingLogout, startLogoutTransition] = useTransition();

  const selectedSongPreview = songs.find((s) => s.id === selectedSongId);

  // Mantém selectedSongId sincronizado caso a música selecionada seja excluída ou a 1ª música seja cadastrada
  React.useEffect(() => {
    if (songs.length === 0) {
      setSelectedSongId("");
    } else if (!songs.some((s) => s.id === selectedSongId)) {
      setSelectedSongId(songs[0].id);
    }
  }, [songs, selectedSongId]);

  // Carrega um desafio existente no formulário para reagendar/editar facilmente
  const handleLoadChallengeToEdit = (item: AdminChallengeItem) => {
    setActiveTab("challenges");
    setChallengeDate(item.challengeDate);
    setSelectedSongId(item.songId);
    setInitialLyric(item.initialLyric);
    setHint1Lyric(item.hint1Lyric);
    setHint2Lyric(item.hint2Lyric);
    setChallengeFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submete o agendamento (upsert por challengeDate)
  const handleChallengeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPendingChallenge) return;

    setChallengeFeedback(null);
    startChallengeTransition(async () => {
      const result = await upsertDailyChallengeAction({
        challengeDate,
        songId: selectedSongId,
        initialLyric,
        hint1Lyric,
        hint2Lyric,
      });
      setChallengeFeedback(result);
      if (result.success) {
        setInitialLyric("");
        setHint1Lyric("");
        setHint2Lyric("");
      }
    });
  };

  const handleDeleteChallenge = (id: string, date: string) => {
    if (isPendingChallenge) return;
    if (!window.confirm(`Deseja remover o agendamento do dia ${date}?`)) return;

    setChallengeFeedback(null);
    startChallengeTransition(async () => {
      const result = await deleteDailyChallengeAction(id);
      setChallengeFeedback(result);
    });
  };

  // Carrega uma música no formulário para edição
  const handleEditSong = (song: AdminSongItem) => {
    setActiveTab("songs");
    setEditingSongId(song.id);
    setSongTitle(song.title);
    setSongArtist(song.artist);
    setSongYear(song.releaseYear);
    setSongGenre(song.genre);
    setSongFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetSongForm = () => {
    setEditingSongId(undefined);
    setSongTitle("");
    setSongArtist("");
    setSongYear(new Date().getFullYear());
    setSongGenre("");
  };

  // Submete criação/atualização de música (gera search_index automaticamente no servidor)
  const handleSongSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPendingSong) return;

    setSongFeedback(null);
    startSongTransition(async () => {
      const result = await saveSongAction({
        id: editingSongId,
        title: songTitle,
        artist: songArtist,
        releaseYear: Number(songYear),
        genre: songGenre,
      });
      setSongFeedback(result);
      if (result.success) {
        handleResetSongForm();
      }
    });
  };

  const handleDeleteSong = (song: AdminSongItem) => {
    if (isPendingSong) return;
    if (
      !window.confirm(
        `Remover "${song.title} — ${song.artist}" do catálogo? Isso também removerá desafios vinculados a ela.`
      )
    ) {
      return;
    }

    setSongFeedback(null);
    startSongTransition(async () => {
      const result = await deleteSongAction(song.id);
      setSongFeedback(result);
    });
  };

  const filteredSongs = songs.filter((s) => {
    if (!songSearchFilter.trim()) return true;
    const normalizedFilter = songSearchFilter
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return (
      s.searchIndex.includes(normalizedFilter) ||
      s.genre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(normalizedFilter)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Topbar Admin */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Music2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Admin • Música do Dia
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hoje em São Paulo: <strong>{todaySaoPaulo}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver Jogo</span>
            </Link>

            <button
              type="button"
              disabled={isPendingLogout}
              onClick={() =>
                startLogoutTransition(async () => {
                  await logoutAdminAction();
                })
              }
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Abas de Navegação */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("challenges")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === "challenges"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agendamento de Desafios ({challenges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("songs")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === "songs"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Music2 className="w-4 h-4" />
            <span>Catálogo de Músicas ({songs.length})</span>
          </button>
        </div>

        {/* ABA 1: AGENDAMENTO DE DESAFIOS DIÁRIOS */}
        {activeTab === "challenges" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Formulário de Upsert de Desafio Diário */}
            <section className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Agendar / Reagendar Desafio</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Se a data já possuir desafio, ele será atualizado
                  automaticamente (Upsert).
                </p>
              </div>

              {challengeFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                    challengeFeedback.success
                      ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  {challengeFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>{challengeFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleChallengeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Data do Desafio (America/Sao_Paulo)
                  </label>
                  <input
                    type="date"
                    value={challengeDate}
                    onChange={(e) => setChallengeDate(e.target.value)}
                    disabled={isPendingChallenge}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Música Oficial do Desafio
                  </label>
                  <select
                    value={selectedSongId}
                    onChange={(e) => setSelectedSongId(e.target.value)}
                    disabled={isPendingChallenge}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {songs.map((song) => (
                      <option key={song.id} value={song.id}>
                        {song.artist} — {song.title} ({song.releaseYear})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preview automático da Dica 3 (Metadados extraídos da música) */}
                {selectedSongPreview && (
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1">
                    <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Dica 3 (Gerada Automaticamente):</span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      Artista: <strong>{selectedSongPreview.artist}</strong> •
                      Ano: <strong>{selectedSongPreview.releaseYear}</strong> •
                      Estilo: <strong>{selectedSongPreview.genre}</strong>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    1º Trecho Inicial (Tentativa 1)
                  </label>
                  <textarea
                    rows={2}
                    value={initialLyric}
                    onChange={(e) => setInitialLyric(e.target.value)}
                    disabled={isPendingChallenge}
                    required
                    placeholder="Ex: Quando eu digo que deixei de te amar / É porque eu te amo"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Dica 1 • 2º Trecho da Letra (Tentativa 2)
                  </label>
                  <textarea
                    rows={2}
                    value={hint1Lyric}
                    onChange={(e) => setHint1Lyric(e.target.value)}
                    disabled={isPendingChallenge}
                    required
                    placeholder="Ex: Quando eu digo que não quero mais você / É porque eu te quero"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Dica 2 • 3º Trecho da Letra (Tentativa 3)
                  </label>
                  <textarea
                    rows={2}
                    value={hint2Lyric}
                    onChange={(e) => setHint2Lyric(e.target.value)}
                    disabled={isPendingChallenge}
                    required
                    placeholder="Ex: Eu tenho medo de te dar meu coração / E confessar que eu estou em tuas mãos"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPendingChallenge || songs.length === 0}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:pointer-events-none transition-all"
                >
                  {isPendingChallenge ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando Agendamento...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Desafio Diário</span>
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Lista de Desafios Agendados */}
            <section className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Calendário de Desafios Agendados
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Clique em Editar para carregar no formulário
                </span>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[640px] overflow-y-auto pr-1">
                {challenges.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Nenhum desafio agendado ainda.
                  </p>
                ) : (
                  challenges.map((item) => {
                    const isToday = item.challengeDate === todaySaoPaulo;
                    return (
                      <div
                        key={item.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                              {item.challengeDate}
                            </span>
                            {isToday && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                Desafio de Hoje
                              </span>
                            )}
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {item.song.title} — {item.song.artist}
                            </span>
                          </div>
                          <p className="text-xs italic text-slate-500 dark:text-slate-400 truncate">
                            “{item.initialLyric}”
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleLoadChallengeToEdit(item)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            disabled={isPendingChallenge}
                            onClick={() =>
                              handleDeleteChallenge(item.id, item.challengeDate)
                            }
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 disabled:opacity-50 transition-colors"
                            title="Remover agendamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {/* ABA 2: CATÁLOGO DE MÚSICAS */}
        {activeTab === "songs" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Formulário de Cadastro / Edição de Música */}
            <section className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>
                      {editingSongId
                        ? "Editar Música"
                        : "Cadastrar Nova Música"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    O índice de busca sem acentos (<code>search_index</code>) é
                    gerado automaticamente.
                  </p>
                </div>

                {editingSongId && (
                  <button
                    type="button"
                    onClick={handleResetSongForm}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              {songFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                    songFeedback.success
                      ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  {songFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>{songFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleSongSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Título da Música
                  </label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    disabled={isPendingSong}
                    required
                    placeholder="Ex: Águas de Março"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Banda / Artista
                  </label>
                  <input
                    type="text"
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    disabled={isPendingSong}
                    required
                    placeholder="Ex: Elis Regina & Tom Jobim"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Ano de Lançamento
                    </label>
                    <input
                      type="number"
                      min={1900}
                      max={new Date().getFullYear() + 1}
                      value={songYear}
                      onChange={(e) => setSongYear(Number(e.target.value))}
                      disabled={isPendingSong}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Estilo Musical
                    </label>
                    <input
                      type="text"
                      value={songGenre}
                      onChange={(e) => setSongGenre(e.target.value)}
                      disabled={isPendingSong}
                      required
                      placeholder="Ex: MPB"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPendingSong}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:pointer-events-none transition-all"
                >
                  {isPendingSong ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando Música...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>
                        {editingSongId
                          ? "Salvar Alterações"
                          : "Adicionar ao Catálogo"}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Lista do Catálogo de Músicas */}
            <section className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Músicas Cadastradas ({filteredSongs.length})
                </h2>

                <div className="relative flex items-center w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={songSearchFilter}
                    onChange={(e) => setSongSearchFilter(e.target.value)}
                    placeholder="Filtrar catálogo..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[600px] overflow-y-auto pr-1">
                {filteredSongs.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Nenhuma música encontrada.
                  </p>
                ) : (
                  filteredSongs.map((song) => (
                    <div
                      key={song.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {song.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {song.artist} • {song.releaseYear} • {song.genre}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate">
                          search_index: &ldquo;{song.searchIndex}&rdquo;
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditSong(song)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          disabled={isPendingSong}
                          onClick={() => handleDeleteSong(song)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 disabled:opacity-50 transition-colors"
                          title="Excluir música"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
