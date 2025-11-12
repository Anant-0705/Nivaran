// Backend test setup
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.AI_SERVICE_URL = 'http://localhost:8000';

// Global test timeout
jest.setTimeout(30000);

// Global mocks
global.console = {
  ...console,
  // Uncomment to silence logs during tests
  // log: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
