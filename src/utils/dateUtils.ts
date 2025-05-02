import { 
  format, 
  formatISO, 
  parseISO, 
  fromUnixTime, 
  addSeconds,
  isValid,
  formatDistance
} from 'date-fns';

/**
 * Date utility functions using date-fns for consistent date handling
 * All dates are stored and manipulated in UTC by default
 */

/**
 * Safely execute a function that might throw
 * @param fn Function to execute
 * @param fallback Fallback value if function throws
 * @returns Result of function or fallback
 */
const safeExecute = <T, F>(fn: () => T, fallback: F): T | F => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

/**
 * Converts a Unix timestamp to a Date object
 * @param unixTimestamp Unix timestamp in seconds
 * @returns Date object in UTC
 */
export const fromUnixTimestamp = (unixTimestamp: number): Date => {
  return fromUnixTime(unixTimestamp);
};

/**
 * Creates a current timestamp in UTC
 * @returns Current Date object in UTC
 */
export const nowUTC = (): Date => {
  return new Date();
};

/**
 * Adds seconds to a date
 * @param date The base date
 * @param seconds Number of seconds to add
 * @returns New Date with seconds added
 */
export const addSecondsToDate = (date: Date, seconds: number): Date => {
  return addSeconds(date, seconds);
};

/**
 * Normalize input to a Date object if possible
 * @param input Date input (Date object, ISO string, timestamp)
 * @returns Date object or null if invalid
 */
export const normalizeToDate = (input: Date | string | number | null | undefined): Date | null => {
  if (!input) return null;
  
  if (typeof input === 'string') {
    const parsed = parseISO(input);
    return isValid(parsed) ? parsed : null;
  }
  
  if (typeof input === 'number') {
    const date = new Date(input);
    return isValid(date) ? date : null;
  }
  
  return isValid(input) ? input : null;
};

/**
 * Formats a date for display in a standardized format
 * @param date Date to format (Date object, ISO string, or timestamp)
 * @param formatString Optional format string (defaults to 'PPpp' - 'Apr 29, 2025, 12:00:00 PM')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | number | null | undefined, formatString: string = 'PPpp'): string => {
  if (!date) return '';
  
  const normalizedDate = normalizeToDate(date);
  if (!normalizedDate) return 'Invalid date';
  
  return safeExecute(() => format(normalizedDate, formatString), 'Invalid date');
};

/**
 * Formats a date in ISO 8601 format for API exchange
 * @param date Date to format
 * @returns ISO 8601 formatted date string
 */
export const formatDateISO = (date: Date | null | undefined): string => {
  if (!date || !isValid(date)) return '';
  return safeExecute(() => formatISO(date), '');
};

/**
 * Safely parse an ISO date string to a Date object
 * @param isoString ISO 8601 date string
 * @returns Date object or null if invalid
 */
export const parseISODate = (isoString: string | null | undefined): Date | null => {
  if (!isoString) return null;
  return normalizeToDate(isoString);
};

/**
 * Parse a UTC date string (like "Fri, 02 May 2025 00:00:01 +0000")
 * @param utcString UTC date string
 * @returns Date object or null if invalid
 */
export const parseUTCString = (utcString: string | null | undefined): Date | null => {
  if (!utcString) return null;
  
  return safeExecute(() => {
    const date = new Date(utcString);
    return isValid(date) ? date : null;
  }, null);
};

/**
 * Format a date as a relative time (e.g., "3 hours ago", "in 5 days")
 * @param date Date to format
 * @param baseDate Date to compare to (defaults to now)
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (
  date: Date | string | number | null | undefined, 
  baseDate: Date = new Date()
): string => {
  const normalizedDate = normalizeToDate(date);
  if (!normalizedDate) return 'Invalid date';
  
  return safeExecute(
    () => formatDistance(normalizedDate, baseDate, { addSuffix: true }),
    'Invalid date'
  );
}; 