module.exports = {
  verbose: true,
  // transform: {
  //   '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  // },
  setupFilesAfterEnv: ['./setupTests.js'],
  testEnvironment: 'jsdom',
};
