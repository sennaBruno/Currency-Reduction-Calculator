import { 
  fromUnixTimestamp,
  nowUTC,
  addSecondsToDate,
  formatDate,
  formatDateISO,
  parseISODate,
  parseUTCString,
  formatRelativeTime
} from '../dateUtils';

describe('Date Utils', () => {
  // Mock the current date for testing
  const fixedDate = new Date('2025-05-15T10:30:00.000Z');
  let originalDate: DateConstructor;

  beforeEach(() => {
    originalDate = global.Date;
    // @ts-ignore - Mocking Date constructor
    global.Date = jest.fn(() => fixedDate);
    global.Date.UTC = originalDate.UTC;
    global.Date.parse = originalDate.parse;
    global.Date.now = jest.fn(() => fixedDate.getTime());
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  describe('fromUnixTimestamp', () => {
    it('converts a unix timestamp to Date', () => {
      const timestamp = 1620000000; // May 3, 2021, 00:00:00 UTC
      const expected = new Date('2021-05-03T00:00:00.000Z');
      
      expect(fromUnixTimestamp(timestamp).toISOString()).toBe(expected.toISOString());
    });
  });

  describe('nowUTC', () => {
    it('returns the current date in UTC', () => {
      expect(nowUTC().toISOString()).toBe(fixedDate.toISOString());
    });
  });

  describe('addSecondsToDate', () => {
    it('adds seconds to a date', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const secondsToAdd = 3600; // 1 hour
      const expected = new Date('2025-01-01T01:00:00.000Z');
      
      expect(addSecondsToDate(date, secondsToAdd).toISOString()).toBe(expected.toISOString());
    });

    it('handles negative seconds', () => {
      const date = new Date('2025-01-01T01:00:00.000Z');
      const secondsToSubtract = -3600; // -1 hour
      const expected = new Date('2025-01-01T00:00:00.000Z');
      
      expect(addSecondsToDate(date, secondsToSubtract).toISOString()).toBe(expected.toISOString());
    });
  });

  describe('formatDate', () => {
    it('formats a Date object with default format', () => {
      const date = new Date('2025-04-29T12:00:00.000Z');
      expect(formatDate(date)).toMatch(/Apr 29, 2025/);
    });

    it('formats a date string with default format', () => {
      const dateString = '2025-04-29T12:00:00.000Z';
      expect(formatDate(dateString)).toMatch(/Apr 29, 2025/);
    });

    it('formats a date with custom format', () => {
      const date = new Date('2025-04-29T12:00:00.000Z');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2025-04-29');
    });

    it('returns empty string for falsy values', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate(null as any)).toBe('');
    });

    it('handles invalid dates', () => {
      expect(formatDate('not-a-date')).toBe('Invalid date');
    });
  });

  describe('formatDateISO', () => {
    it('formats a date in ISO 8601 format', () => {
      const date = new Date('2025-04-29T12:00:00.000Z');
      expect(formatDateISO(date)).toMatch(/^2025-04-29T/);
    });
  });

  describe('parseISODate', () => {
    it('parses a valid ISO string to Date', () => {
      const isoString = '2025-04-29T12:00:00.000Z';
      const parsed = parseISODate(isoString);
      expect(parsed?.toISOString()).toBe(isoString);
    });

    it('returns null for invalid ISO string', () => {
      expect(parseISODate('invalid-date')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseISODate('')).toBeNull();
    });
  });

  describe('parseUTCString', () => {
    it('parses a valid UTC string to Date', () => {
      const utcString = 'Fri, 02 May 2025 00:00:01 +0000';
      const parsed = parseUTCString(utcString);
      expect(parsed?.toUTCString()).toMatch(/Fri, 02 May 2025/);
    });

    it('returns null for invalid UTC string', () => {
      expect(parseUTCString('invalid-date')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(parseUTCString(null)).toBeNull();
    });
  });

  describe('formatRelativeTime', () => {
    it('formats a future date as relative time', () => {
      const futureDate = new Date('2025-05-16T10:30:00.000Z'); // 1 day in future from fixed date
      expect(formatRelativeTime(futureDate, fixedDate)).toBe('in 1 day');
    });

    it('formats a past date as relative time', () => {
      const pastDate = new Date('2025-05-14T10:30:00.000Z'); // 1 day in past from fixed date
      expect(formatRelativeTime(pastDate, fixedDate)).toBe('1 day ago');
    });

    it('handles string dates', () => {
      const dateString = '2025-05-14T10:30:00.000Z'; // 1 day in past from fixed date
      expect(formatRelativeTime(dateString, fixedDate)).toBe('1 day ago');
    });

    it('handles invalid dates', () => {
      expect(formatRelativeTime('invalid-date', fixedDate)).toBe('Invalid date');
    });
  });
}); 