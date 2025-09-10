// Mock clientLogger for testing
const clientLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  userAction: jest.fn(),
  performance: jest.fn(),
  apiCall: jest.fn(),
  navigation: jest.fn(),
  reactError: jest.fn(),
  log: jest.fn(),
  flush: jest.fn(),
  forceFlush: jest.fn()
};

export default clientLogger;