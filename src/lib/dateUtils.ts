/**
 * Safely parses any date representation from backend APIs:
 * - ISO string: "2026-08-17T14:30:25"
 * - Spring Boot Jackson array: [2026, 8, 17, 14, 30, 25]
 * - Unix timestamp in seconds or milliseconds
 */
export function parseApiDate(dateVal: any): Date | null {
  if (!dateVal) return null;

  if (Array.isArray(dateVal)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateVal;
    const d = new Date(year, month - 1, day, hour, minute, second);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof dateVal === 'number') {
    const ms = dateVal < 10000000000 ? dateVal * 1000 : dateVal;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof dateVal === 'string') {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Formats date as DD.MM.YYYY
 */
export function formatDate(dateVal: any, fallback = 'N/A'): string {
  const d = parseApiDate(dateVal);
  if (!d) return fallback;
  return d.toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formats date and time as DD.MM.YYYY, HH:MM
 */
export function formatDateTime(dateVal: any, fallback = 'N/A'): string {
  const d = parseApiDate(dateVal);
  if (!d) return fallback;
  return d.toLocaleString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
