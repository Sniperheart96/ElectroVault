import { beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Global test setup
// Wird vor jedem Test ausgeführt

// Mocks für Browser APIs (falls notwendig)
if (typeof window !== 'undefined') {
  // Setup für Frontend-Tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Cleanup nach jedem Test
afterEach(() => {
  vi.clearAllMocks();
});
