// 19 October 2026, 00:00 Europe/Berlin (still summer time, UTC+02:00).
export const anniversaryEndsAt = "2026-10-19T00:00:00+02:00";
export const anniversaryHistory =
  "Die Ottenauer Motorradfreunde blicken auf 50 Jahre Vereinsgeschichte zurück – von der Gründung 1976 bis zum Jubiläumsjahr 2026.";

/** @param {Date | string | number} [now] */
export function isAnniversaryOver(now = new Date()) {
  const timestamp = new Date(now).getTime();
  if (!Number.isFinite(timestamp))
    throw new Error("Invalid anniversary build time");
  return timestamp >= Date.parse(anniversaryEndsAt);
}
