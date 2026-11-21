import type { DailyProgressState, UserStats } from "@/types/game";

const DAILY_PREFIX = "daily_lyric_state_";
const STATS_KEY = "musica_do_dia:stats";
const THEME_KEY = "musica_do_dia:theme";

const DEFAULT_STATS: UserStats = {
  totalGames: 0,
  totalWins: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastCompletedDate: null,
  winDistribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  },
};

export function loadDailyProgress(date: string): DailyProgressState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${DAILY_PREFIX}${date}`);
    if (!raw) return null;
    return JSON.parse(raw) as DailyProgressState;
  } catch (e) {
    console.error("Erro ao carregar progresso diário do localStorage:", e);
    return null;
  }
}

export function saveDailyProgress(state: DailyProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${DAILY_PREFIX}${state.date}`,
      JSON.stringify(state)
    );
  } catch (e) {
    console.error("Erro ao salvar progresso diário no localStorage:", e);
  }
}

export function loadUserStats(): UserStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Erro ao carregar estatísticas do localStorage:", e);
    return DEFAULT_STATS;
  }
}

/**
 * Verifica se `dateA` (YYYY-MM-DD) é exatamente o dia anterior a `dateB` (YYYY-MM-DD)
 */
function isYesterday(dateA: string | null, dateB: string): boolean {
  if (!dateA) return false;
  const [yA, mA, dA] = dateA.split("-").map(Number);
  const [yB, mB, dB] = dateB.split("-").map(Number);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  const diffDays = Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Registra o fim de um jogo diário nas estatísticas históricas do jogador
 */
export function recordGameResult(
  date: string,
  won: boolean,
  attemptCount: number
): UserStats {
  const stats = loadUserStats();

  // Evita contabilizar duas vezes o mesmo dia
  if (stats.lastCompletedDate === date) {
    return stats;
  }

  const totalGames = stats.totalGames + 1;
  let totalWins = stats.totalWins;
  let currentStreak = stats.currentStreak;
  let maxStreak = stats.maxStreak;
  const winDistribution = { ...stats.winDistribution };

  if (won) {
    totalWins += 1;
    currentStreak = isYesterday(stats.lastCompletedDate, date)
      ? currentStreak + 1
      : 1;
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
    const key = Math.min(Math.max(attemptCount, 1), 4) as 1 | 2 | 3 | 4;
    winDistribution[key] = (winDistribution[key] ?? 0) + 1;
  } else {
    currentStreak = 0;
  }

  const updated: UserStats = {
    totalGames,
    totalWins,
    currentStreak,
    maxStreak,
    lastCompletedDate: date,
    winDistribution,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STATS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Erro ao salvar estatísticas no localStorage:", e);
    }
  }

  return updated;
}

export function loadThemePreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(THEME_KEY);
  return saved === "dark" ? "dark" : "light"; // Light mode como padrão
}

export function saveThemePreference(theme: "light" | "dark"): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
}

/**
 * [DEV / TESTE] Reseta as tentativas do dia atual (e permite recontabilizar o dia nas estatísticas)
 */
export function resetDailyProgressForDev(date: string): UserStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    window.localStorage.removeItem(`${DAILY_PREFIX}${date}`);

    // Se o jogo de hoje já tinha sido contabilizado nas estatísticas, libera a trava de lastCompletedDate
    const stats = loadUserStats();
    if (stats.lastCompletedDate === date) {
      const updatedStats: UserStats = {
        ...stats,
        lastCompletedDate: null,
      };
      window.localStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      return updatedStats;
    }
    return stats;
  } catch (e) {
    console.error("Erro ao resetar progresso de desenvolvimento:", e);
    return loadUserStats();
  }
}

/**
 * [DEV / TESTE] Limpa completamente todo o localStorage do jogo (histórico de dias, estatísticas/streak e tema)
 */
export function clearAllLocalStorageForDev(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.clear();
  } catch (e) {
    console.error("Erro ao limpar localStorage em desenvolvimento:", e);
  }
}


