// Location: /jest.config.mjs

import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.mjs and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Use jsdom as the test environment (simulates a browser)
  testEnvironment: 'jest-environment-jsdom',
  // Tell Jest to look for test files in a __tests__ directory
  roots: ['<rootDir>/__tests__'],

  // Handle module aliases (like @/* from your tsconfig.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);

