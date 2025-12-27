import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./client/src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'client/src/__tests__/',
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js}',
        '**/types/',
        'dist/',
      ],
      include: [
        'client/src/services/**/*.ts',
        'client/src/shared/**/*.ts',
        'client/src/hooks/**/*.ts',
        'client/src/entities/**/*.ts',
        'client/src/components/auth/**/*.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
});
