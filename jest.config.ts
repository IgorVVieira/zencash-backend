export default {
  roots: ['<rootDir>/src'],
  clearMocks: true,
  collectCoverage: true,
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/main/**'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  transform: {
    '.+\\.ts$': ['ts-jest', { useESM: false, tsconfig: { types: ['jest', 'node'] } }],
  },
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@users/(.*)$': '<rootDir>/src/users/$1',
    '^@transactions/(.*)$': '<rootDir>/src/transactions/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@payments/(.*)$': '<rootDir>/src/payments/$1',
    '^@fixed-bills/(.*)$': '<rootDir>/src/fixed-bills/$1',
  },
};
