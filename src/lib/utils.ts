/**
 * Utilitários de data e texto para o jogo Música do Dia
 */

/**
 * Retorna a data atual no fuso horário America/Sao_Paulo no formato YYYY-MM-DD
 */
export function getCurrentSaoPauloDate(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/**
 * Calcula quantos segundos faltam até a próxima meia-noite em America/Sao_Paulo
 */
export function getSecondsUntilSaoPauloMidnight(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const second = Number(parts.find((p) => p.type === "second")?.value ?? 0);

  const elapsedSeconds = hour * 3600 + minute * 60 + second;
  const totalDaySeconds = 24 * 3600;
  return Math.max(0, totalDaySeconds - elapsedSeconds);
}

/**
 * Formata segundos em HH:MM:SS
 */
export function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((val) => String(val).padStart(2, "0"))
    .join(":");
}

/**
 * Normaliza uma string removendo acentos, convertendo para minúsculas e limpando espaços extras.
 * Usado para indexar e buscar músicas no autocomplete.
 */
export function normalizeSearchQuery(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
