// utils/formatDate.ts
export function formatDate(isoString: string): string {
  const date = new Date(isoString);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const formatted = `${months[date.getUTCMonth()]} ${date.getUTCDate()} ${date.getUTCFullYear()} ${String(date.getUTCHours()).padStart(2,'0')}:${String(date.getUTCMinutes()).padStart(2,'0')}`;

  return formatted;
}
