import '@testing-library/jest-dom';

global.fetch = jest.fn();

const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Not implemented: navigation')) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

beforeEach(() => {
  jest.clearAllMocks();
});
