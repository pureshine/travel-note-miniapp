export function formatMonthDay(dateText: string): string {
  const parts = dateText.split("-");
  if (parts.length !== 3) return dateText;
  return `${Number(parts[1])}月${Number(parts[2])}日`;
}

export function today(): string {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
