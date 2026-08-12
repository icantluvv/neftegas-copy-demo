export function formatNotificationDateTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);

  const datePart = date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Moscow",
  });
  const timePart = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  });

  return `${datePart} ${timePart}`;
}
