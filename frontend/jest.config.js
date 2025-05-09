module.exports = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
      '^@/components/(.*)$': '<rootDir>/src/components/$1',
      '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
      '^@/app/(.*)$': '<rootDir>/src/app/$1'
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
    }
  };