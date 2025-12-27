/**
 * Test Setup File
 * Global test configuration and polyfills
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Create functional localStorage mock with actual storage
const createStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
};

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();

global.localStorage = localStorageMock as any;
global.sessionStorage = sessionStorageMock as any;

// Also expose on globalThis for better compatibility
globalThis.localStorage = localStorageMock as any;
globalThis.sessionStorage = sessionStorageMock as any;

// Mock window.matchMedia
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

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Reset storage before each test
beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Cleanup after each test
afterEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
  vi.clearAllMocks();
});
