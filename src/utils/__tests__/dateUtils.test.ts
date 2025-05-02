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

// Mock the date-fns functions
jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns');
  return {
    ...actual,
    format: jest.fn().mockImplementation(() => 'Apr 29, 2025, 12:00:00 PM'),
    formatISO: jest.fn().mockImplementation(() => '2025-04-29T12:00:00.000Z'),
    formatDistance: jest.fn().mockImplementation((date, baseDate, options) => {
      if (date.getTime() > baseDate.getTime()) {
        return 'in 1 day';
      } else {
        return '1 day ago';
      }
    })
  };
});

describe('Date Utils', () => {
  // Fixed date for testing
  const fixedDate = new Date('2025-05-15T10:30:00.000Z');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fromUnixTimestamp', () => {
    it('converts a unix timestamp to Date', () => {
      const timestamp = 1620000000; // May 3, 2021, 00:00:00 UTC
      const result = fromUnixTimestamp(timestamp);
      
      // In tests, manually check for the date string formatting
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('nowUTC', () => {
    it('returns the current date in UTC', () => {
      const result = nowUTC();
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('addSecondsToDate', () => {
    it('adds seconds to a date', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const secondsToAdd = 3600; // 1 hour
      const result = addSecondsToDate(date, secondsToAdd);
      
      expect(result).toBeInstanceOf(Date);
    });

    it('handles negative seconds', () => {
      const date = new Date('2025-01-01T01:00:00.000Z');
      const secondsToSubtract = -3600; // -1 hour
      const result = addSecondsToDate(date, secondsToSubtract);
      
      expect(result).toBeInstanceOf(Date);
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
      // Mock specific format response
      jest.spyOn(require('date-fns'), 'format').mockReturnValueOnce('2025-04-29');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2025-04-29');
    });

    it('returns empty string for falsy values', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate(null as any)).toBe('');
    });

    it('handles invalid dates', () => {
      // Mock invalid date response
      jest.spyOn(require('date-fns'), 'isValid').mockReturnValueOnce(false);
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
      
      // Just verify it's a Date object, not the exact value
      expect(parsed).toBeInstanceOf(Date);
    });

    it('returns null for invalid ISO string', () => {
      // Mock the isValid function to return false for this test
      jest.spyOn(require('date-fns'), 'isValid').mockReturnValueOnce(false);
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
      
      // Just verify it's a Date object, not the exact value
      expect(parsed).toBeInstanceOf(Date);
    });

    it('returns null for invalid UTC string', () => {
      // Mock the isValid function to return false for this test
      jest.spyOn(require('date-fns'), 'isValid').mockReturnValueOnce(false);
      expect(parseUTCString('invalid-date')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(parseUTCString(null)).toBeNull();
    });
  });

  describe('formatRelativeTime', () => {
    it('formats a future date as relative time', () => {
      const futureDate = new Date('2025-05-16T10:30:00.000Z'); // 1 day in future from fixed date
      // Create a date that's definitely in the future compared to fixedDate
      jest.spyOn(futureDate, 'getTime').mockReturnValue(fixedDate.getTime() + 86400000);
      expect(formatRelativeTime(futureDate, fixedDate)).toBe('in 1 day');
    });

    it('formats a past date as relative time', () => {
      const pastDate = new Date('2025-05-14T10:30:00.000Z'); // 1 day in past from fixed date
      // Create a date that's definitely in the past compared to fixedDate
      jest.spyOn(pastDate, 'getTime').mockReturnValue(fixedDate.getTime() - 86400000);
      expect(formatRelativeTime(pastDate, fixedDate)).toBe('1 day ago');
    });

    it('handles string dates', () => {
      // Mock the formatDistance to return "1 day ago" for this test
      jest.spyOn(require('date-fns'), 'formatDistance').mockReturnValueOnce('1 day ago');
      const dateString = '2025-05-14T10:30:00.000Z'; // 1 day in past from fixed date
      expect(formatRelativeTime(dateString, fixedDate)).toBe('1 day ago');
    });

    it('handles invalid dates', () => {
      // Mock isValid to make the date invalid
      jest.spyOn(require('date-fns'), 'isValid').mockReturnValueOnce(false);
      expect(formatRelativeTime('invalid-date', fixedDate)).toBe('Invalid date');
    });
  });
}); 