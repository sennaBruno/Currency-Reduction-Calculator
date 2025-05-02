import { 
  format, 
  formatISO, 
  parseISO, 
  fromUnixTime, 
  addSeconds,
  isValid,
  formatDistance,
  formatRelative
} from 'date-fns';

/**
 * Date utility functions using date-fns for consistent date handling
 * All dates are stored and manipulated in UTC by default
 */

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
 * Formats a date for display in a standardized format
 * @param date Date to format
 * @param formatString Optional format string (defaults to 'PPpp' - 'Apr 29, 2025, 12:00:00 PM')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | number, formatString: string = 'PPpp'): string => {
  if (!date) return '';
  
  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? parseISO(date) : typeof date === 'number' ? new Date(date) : date;
  
  // Validate the date object
  if (!isValid(dateObj)) return 'Invalid date';
  
  return format(dateObj, formatString);
};

/**
 * Formats a date in ISO 8601 format for API exchange
 * @param date Date to format
 * @returns ISO 8601 formatted date string
 */
export const formatDateISO = (date: Date): string => {
  return formatISO(date);
};

/**
 * Safely parse an ISO date string to a Date object
 * @param isoString ISO 8601 date string
 * @returns Date object or null if invalid
 */
export const parseISODate = (isoString: string): Date | null => {
  if (!isoString) return null;
  const date = parseISO(isoString);
  return isValid(date) ? date : null;
};

/**
 * Parse a UTC date string (like "Fri, 02 May 2025 00:00:01 +0000")
 * @param utcString UTC date string
 * @returns Date object or null if invalid
 */
export const parseUTCString = (utcString: string | null): Date | null => {
  if (!utcString) return null;
  const date = new Date(utcString);
  return isValid(date) ? date : null;
};

/**
 * Format a date as a relative time (e.g., "3 hours ago", "in 5 days")
 * @param date Date to format
 * @param baseDate Date to compare to (defaults to now)
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: Date | string, baseDate: Date = new Date()): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  
  return formatDistance(dateObj, baseDate, { addSuffix: true });
}; 