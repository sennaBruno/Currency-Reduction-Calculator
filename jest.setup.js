// Import jest-dom utilities for DOM testing
require('@testing-library/jest-dom');

// Mock Next.js cache functionality since we can't use it in tests
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn().mockImplementation((fn) => {
    return (...args) => fn(...args);
  })
}));

// Mock environment variables that might be used in tests
process.env = {
  ...process.env,
  EXCHANGE_RATE_API_KEY: 'test-api-key',
  EXCHANGE_RATE_CACHE_REVALIDATE_SECONDS: '3600',
  EXCHANGE_RATE_API_PROVIDER: 'default',
};

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection in tests:', error);
}); 