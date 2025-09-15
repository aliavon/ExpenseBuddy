module.exports = {
  displayName: 'Client Tests',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/../setupTests.js'],
  testMatch: ['<rootDir>/**/*.test.js', '<rootDir>/**/*.spec.js'],
  collectCoverageFrom: [
    '<rootDir>/**/*.js',
    '!<rootDir>/**/*.test.js',
    '!<rootDir>/**/*.spec.js',
    '!<rootDir>/**/index.js', // Skip index files as they're just exports
    '!<rootDir>/serviceWorker.js',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/../coverage',
  moduleNameMapping: { '^@/(.*)$': '<rootDir>/$1' },
  transform: { '^.+\\.(js|jsx)$': 'babel-jest' },
  testTimeout: 10000,
  verbose: true,
};
