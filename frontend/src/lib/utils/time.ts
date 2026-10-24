// Formats a wall-clock "HH:MM" time (as stored for tournament start times) in the viewer's locale.
// The time belongs to the tournament's own time zone, so it is formatted without any zone shift.
export function formatWallClockTime(
  time: string,
  locales: Intl.LocalesArgument = typeof navigator !== "undefined"
    ? navigator.languages
    : undefined,
): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) {
    return time;
  }

  const date = new Date(Date.UTC(1970, 0, 1, Number(match[1]), Number(match[2])));
  return date.toLocaleTimeString(locales, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}
