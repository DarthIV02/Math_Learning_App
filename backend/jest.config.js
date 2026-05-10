// jest.config.js
require('dotenv').config({ path: 'backend/.env.test' });

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
};