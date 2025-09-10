# Testing Guide

## Overview
Proyek ini menggunakan Jest untuk unit testing dan Cypress untuk end-to-end testing.

## Setup Testing Framework

### Jest Configuration
- **File konfigurasi**: `jest.config.js`
- **Setup file**: `jest.setup.js`
- **Polyfills**: `jest.polyfills.js`
- **Environment**: jsdom untuk testing komponen React

### Cypress Configuration
- **File konfigurasi**: `cypress.config.js`
- **Support files**: `cypress/support/`
- **Test files**: `cypress/e2e/`
- **Fixtures**: `cypress/fixtures/`

## Running Tests

### Jest (Unit Tests)
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Cypress (E2E Tests)
```bash
# Open Cypress GUI
npm run cypress:open

# Run Cypress headless
npm run cypress:run

# Run E2E tests
npm run test:e2e
```

### Run All Tests
```bash
npm run test:all
```

## Test Structure

### Unit Tests
- **Location**: `__tests__/` dan `components/__tests__/`
- **Naming**: `*.test.js` atau `*.spec.js`
- **Framework**: Jest + React Testing Library

### E2E Tests
- **Location**: `cypress/e2e/`
- **Naming**: `*.cy.js`
- **Framework**: Cypress

## Test Examples

### Component Test
```javascript
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### API Test
```javascript
import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/example';

test('API endpoint works', async () => {
  const { req, res } = createMocks({ method: 'GET' });
  await handler(req, res);
  expect(res._getStatusCode()).toBe(200);
});
```

### E2E Test
```javascript
describe('Homepage', () => {
  it('loads successfully', () => {
    cy.visit('/');
    cy.get('h1').should('be.visible');
  });
});
```

## Mocking

### Client Logger Mock
File `__mocks__/clientLogger.js` menyediakan mock untuk client-side logging.

### API Mocks
Gunakan `node-mocks-http` untuk mock HTTP requests dalam API tests.

## Coverage

Jest dikonfigurasi untuk menghasilkan coverage report:
- **Threshold**: 80% untuk statements, branches, functions, dan lines
- **Output**: `coverage/` directory
- **Format**: HTML, text, lcov

## Best Practices

1. **Test Naming**: Gunakan deskripsi yang jelas
2. **Test Structure**: Arrange, Act, Assert
3. **Mocking**: Mock dependencies eksternal
4. **Cleanup**: Gunakan `beforeEach` dan `afterEach`
5. **Assertions**: Gunakan matcher yang spesifik

## Troubleshooting

### Common Issues
1. **Import errors**: Pastikan path import benar
2. **Mock issues**: Periksa mock configuration
3. **Async tests**: Gunakan `await` atau `waitFor`
4. **DOM cleanup**: Pastikan cleanup setelah test

### Debug Tips
- Gunakan `screen.debug()` untuk melihat DOM
- Gunakan `console.log` dalam test untuk debugging
- Jalankan test individual dengan `--testNamePattern`

## Files Created

### Configuration Files
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup and mocks
- `jest.polyfills.js` - Polyfills for Jest
- `cypress.config.js` - Cypress configuration

### Test Files
- `__tests__/setup.test.js` - Basic Jest setup test
- `components/__tests__/ErrorBoundary.test.js` - ErrorBoundary component test
- `components/__tests__/Button.test.js` - Button component test
- `__tests__/api/auth/login.test.js` - Login API test
- `cypress/e2e/auth.cy.js` - Authentication E2E test
- `cypress/e2e/homepage.cy.js` - Homepage E2E test

### Support Files
- `cypress/support/e2e.js` - Cypress E2E support
- `cypress/support/commands.js` - Custom Cypress commands
- `__mocks__/clientLogger.js` - Client logger mock

### Fixtures
- `cypress/fixtures/user.json` - User test data
- `cypress/fixtures/login-success.json` - Login response data
- `cypress/fixtures/register-success.json` - Register response data
- `cypress/fixtures/products.json` - Products test data

Framework testing telah berhasil dikonfigurasi dan siap digunakan!