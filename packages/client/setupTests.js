import '@testing-library/jest-dom';
import {configure} from '@testing-library/react';

configure({testIdAttribute: 'testid'});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to silence logs during testing
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock IntersectionObserver if not available
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver if not available
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Setup fetch mock for network requests
global.fetch = jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  fetch.mockClear();
}); 