// ============================================================
// OneFlesh API — Jest Configuration
// ============================================================

import type { Config } from 'jest';

const config: Config = {
  // Use ts-jest for TypeScript transformation
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  // Module resolution for ESM + path aliases
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@oneflesh/shared(.*)$': '<rootDir>/../../packages/shared/src$1',
  },

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          // Relaxed for tests
          module: 'ESNext',
          moduleResolution: 'bundler',
        },
      },
    ],
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts',
    '<rootDir>/src/**/*.test.ts',
  ],

  // Setup files run after framework is installed (Jest)
  setupFilesAfterFramework: ['<rootDir>/tests/setup.ts'],

  // Coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/prisma/seed.ts',
    '!src/utils/generateKeys.ts',
    '!src/server.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  // Timeout for integration tests (DB operations can be slow)
  testTimeout: 30000,

  // Show verbose output in CI
  verbose: process.env.CI === 'true',

  // Detect open handles (useful for tracking async leaks)
  detectOpenHandles: true,
  forceExit: true,
};

export default config;
