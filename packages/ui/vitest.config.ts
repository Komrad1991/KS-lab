import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      all: true,
      include: [
        'src/components/command-grouping.ts',
        'src/components/command-run-behavior.ts',
        'src/components/palette-primitives.ts',
        'src/components/palette-state.ts',
        'src/components/shortcut-utils.ts',
        'src/components/tini-command-item.ts',
        'src/components/tini-command-palette.ts',
        'src/components/tini-shortcut.ts',
      ],
      exclude: ['src/components/**/*.spec.ts'],
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
});
