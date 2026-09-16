export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateKey: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return null;
  }

  const [year, month, day] = dateKey.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

export function diffCalendarDays(left: Date, right: Date): number {
  const leftDate = new Date(left.getFullYear(), left.getMonth(), left.getDate());
  const rightDate = new Date(right.getFullYear(), right.getMonth(), right.getDate());

  return Math.round((leftDate.getTime() - rightDate.getTime()) / 86400000);
}
