import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",

  testEnvironment: "node",

  // Only pick up test files inside src/__tests__/
  testMatch: ["<rootDir>/src/__tests__/**/*.test.ts"],

  // Map the @ alias to src/ (mirrors tsconfig paths if configured)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Coverage settings
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/__tests__/**",
    "!src/**/index.ts",
  ],
  coverageDirectory: "coverage",
};

export default config;
