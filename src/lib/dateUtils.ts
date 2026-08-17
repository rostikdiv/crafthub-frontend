/**
 * Safely parses any date representation from backend APIs (which run in UTC):
 * - ISO string: "2026-08-17T11:52:25" or "2026-08-17T11:52:25Z"
 * - Spring Boot Jackson array: [2026, 8, 17, 11, 52, 25]
 * - Unix timestamp in seconds or milliseconds
 */
export function parseApiDate(dateVal: any): Date | null {
  if (!dateVal) return null;

  if (Array.isArray(dateVal)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateVal;
    // Backend LocalDateTime is generated in UTC.
    // Date.UTC treats the components as UTC time.
    const utcTimestamp = Date.UTC(year, month - 1, day, hour, minute, second);
    const d = new Date(utcTimestamp);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof dateVal === 'number') {
    const ms = dateVal < 10000000000 ? dateVal * 1000 : dateVal;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof dateVal === 'string') {
    // If it is an ISO string without explicit timezone, append 'Z' so JS treats it as UTC
    let formattedStr = dateVal.trim();
    if (formattedStr.includes('T') && !formattedStr.endsWith('Z') && !formattedStr.includes('+')) {
      formattedStr += 'Z';
    }
    const d = new Date(formattedStr);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Formats date as DD.MM.YYYY in Ukrainian timezone (Europe/Kyiv)
 */
export function formatDate(dateVal: any, fallback = 'N/A'): string {
  const d = parseApiDate(dateVal);
  if (!d) return fallback;
  return d.toLocaleDateString('uk-UA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formats date and time as DD.MM.YYYY, HH:MM in Ukrainian timezone (Europe/Kyiv)
 */
export function formatDateTime(dateVal: any, fallback = 'N/A'): string {
  const d = parseApiDate(dateVal);
  if (!d) return fallback;
  return d.toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
