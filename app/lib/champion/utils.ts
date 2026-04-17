export function isChampionPredictionOpen(deadline: string | null) {
  if (!deadline) return false;

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return false;

  return Date.now() < deadlineDate.getTime();
}

export function formatChampionDeadline(
  deadline: string | null,
  locale: string = "es"
) {
  if (!deadline) {
    return locale === "es" ? "Fecha por confirmar" : "Date to be confirmed";
  }

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return locale === "es" ? "Fecha por confirmar" : "Date to be confirmed";
  }

  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}