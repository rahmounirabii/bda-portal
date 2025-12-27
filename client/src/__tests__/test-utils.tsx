/**
 * Test Utilities
 * Common test helpers, wrappers, and mock data
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Create a test QueryClient
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wrapper component for tests requiring providers
 */
interface AllTheProvidersProps {
  children: React.ReactNode;
}

export function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Mock Supabase User
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {
      first_name: 'Test',
      last_name: 'User',
      bda_role: 'individual',
    },
    ...overrides,
  } as User;
}

/**
 * Mock Supabase Session
 */
export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-token',
    user: createMockUser(),
    ...overrides,
  } as Session;
}

/**
 * Mock Authentication Response
 */
export function createMockAuthResponse(success: boolean = true) {
  if (success) {
    return {
      data: {
        user: createMockUser(),
        session: createMockSession(),
      },
      error: null,
    };
  }

  return {
    data: { user: null, session: null },
    error: {
      message: 'Invalid credentials',
      status: 400,
    },
  };
}

/**
 * Wait for async updates
 */
export function waitForAsync(ms: number = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock SignupRequest
 */
export function createMockSignupRequest(
  overrides?: Partial<any>
): any {
  return {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    accessType: 'both',
    role: 'individual',
    ...overrides,
  };
}

/**
 * Mock WordPress User
 */
export function createMockWordPressUser(overrides?: any) {
  return {
    id: 123,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'subscriber',
    ...overrides,
  };
}

/**
 * Mock HealthCheckResult
 */
export function createMockHealthCheckResult(status: 'healthy' | 'degraded' | 'down' = 'healthy') {
  return {
    status,
    wordpress: {
      available: status !== 'down',
      responseTime: status === 'healthy' ? 1000 : 6000,
      lastCheck: new Date().toISOString(),
    },
    portal: {
      available: true,
      responseTime: 100,
    },
  };
}

/**
 * Create mock fetch response
 */
export function createMockFetchResponse(data: any, ok: boolean = true) {
  return {
    ok,
    status: ok ? 200 : 400,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

/**
 * Mock localStorage with data
 */
export function setupLocalStorage(data: Record<string, string>) {
  const store: Record<string, string> = { ...data };

  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    length: Object.keys(store).length,
    key: (index: number) => Object.keys(store)[index] || null,
  } as any;
}

/**
 * Suppress console errors/warnings in tests
 */
export function suppressConsole() {
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeAll(() => {
    console.error = () => {};
    console.warn = () => {};
  });

  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });
}

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
