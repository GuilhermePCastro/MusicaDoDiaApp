export type GameStatus = "playing" | "won" | "lost";

export interface Hint3Metadata {
  artist: string;
  year: number;
  genre: string;
}

export interface RevealedHints {
  hint1Lyric?: string;
  hint2Lyric?: string;
  hint3Metadata?: Hint3Metadata;
}

export interface SongResultInfo {
  title: string;
  artist: string;
  releaseYear: number;
  genre: string;
}

export interface SongSearchItem {
  id: string;
  title: string;
  artist: string;
}

export type AttemptStatus = "correct" | "same_artist" | "wrong" | "skipped";

export interface AttemptRecord {
  attemptNumber: number;
  songId?: string;
  title: string;
  artist: string;
  status: AttemptStatus;
}

export interface DailyProgressState {
  challengeId: string;
  date: string; // YYYY-MM-DD
  status: GameStatus;
  attempts: AttemptRecord[];
  revealedHints: RevealedHints;
  revealedSong?: SongResultInfo;
}

export interface UserStats {
  totalGames: number;
  totalWins: number;
  currentStreak: number;
  maxStreak: number;
  lastCompletedDate: string | null;
  winDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
}

// Payloads de resposta da API
export interface TodayChallengeResponse {
  challengeId: string;
  date: string;
  initialLyric: string;
  maxAttempts: number;
}

export interface NextHintPayload {
  level: 1 | 2 | 3;
  type: "lyric" | "metadata";
  content: string | Hint3Metadata;
}

export interface GuessResponse {
  correct: boolean;
  sameArtist?: boolean;
  gameOver?: boolean;
  song?: SongResultInfo;
  nextHint?: NextHintPayload;
}

export interface HintResponse {
  hintLevel: 1 | 2 | 3;
  type: "lyric" | "metadata";
  content: string | Hint3Metadata;
  gameOver?: boolean;
  song?: SongResultInfo;
}
