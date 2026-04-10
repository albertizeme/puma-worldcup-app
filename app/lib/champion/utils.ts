export function isChampionPredictionOpen(deadline: string | null) {
  if (!deadline) return false;

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return false;

  return Date.now() < deadlineDate.getTime();
}

export function formatChampionDeadline(deadline: string | null) {
  if (!deadline) return "Fecha por confirmar";

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "Fecha por confirmar";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}