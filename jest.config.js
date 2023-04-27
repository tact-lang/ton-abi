module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ["/node_modules/","/dist/"],
  maxWorkers: 1,
  snapshotSerializers: ["ton-jest/serializers"],
};