module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testRegex: '.*\.test\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  passWithNoTests: true,
};
