module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  coverageProvider: "babel",
  coverageReporters: ["html", "cobertura"],
  testEnvironment: "node",
};
