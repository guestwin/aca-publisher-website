// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Import Cypress Testing Library commands
import '@testing-library/cypress/add-commands';

// Global configuration
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('requestTimeout', 10000);
Cypress.config('responseTimeout', 10000);

// Global before hook
beforeEach(() => {
  // Clear cookies and local storage before each test
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.clearAllSessionStorage();
  
  // Set viewport
  cy.viewport(1280, 720);
  
  // Intercept common API calls
  cy.intercept('GET', '/api/auth/me', { fixture: 'user.json' }).as('getUser');
  cy.intercept('POST', '/api/auth/login', { fixture: 'login-success.json' }).as('login');
  cy.intercept('POST', '/api/auth/register', { fixture: 'register-success.json' }).as('register');
  cy.intercept('GET', '/api/products', { fixture: 'products.json' }).as('getProducts');
});

// Global after hook
afterEach(() => {
  // Take screenshot on failure
  cy.screenshot({ capture: 'runner', onlyOnFailure: true });
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // You can customize this based on the error type
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  
  // Let other errors fail the test
  return true;
});

// Custom commands for common actions
Cypress.Commands.add('loginAsUser', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/auth');
  cy.get('[data-cy="email-input"]').type(email);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="login-button"]').click();
  cy.wait('@login');
  cy.url().should('not.include', '/auth');
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.loginAsUser('admin@example.com', 'admin123');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="user-menu"]').click();
  cy.get('[data-cy="logout-button"]').click();
  cy.url().should('include', '/auth');
});

Cypress.Commands.add('addToCart', (productId) => {
  cy.intercept('POST', '/api/cart/add', { statusCode: 200 }).as('addToCart');
  cy.get(`[data-cy="add-to-cart-${productId}"]`).click();
  cy.wait('@addToCart');
});

Cypress.Commands.add('clearCart', () => {
  cy.intercept('DELETE', '/api/cart/clear', { statusCode: 200 }).as('clearCart');
  cy.get('[data-cy="clear-cart"]').click();
  cy.wait('@clearCart');
});

// Database seeding commands
Cypress.Commands.add('seedDatabase', () => {
  cy.task('seedDatabase');
});

Cypress.Commands.add('clearDatabase', () => {
  cy.task('clearDatabase');
});

// Wait for page to be fully loaded
Cypress.Commands.add('waitForPageLoad', () => {
  cy.window().should('have.property', 'document');
  cy.document().should('have.property', 'readyState', 'complete');
});

// Custom assertion for loading states
Cypress.Commands.add('shouldNotBeLoading', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('not.have.class', 'loading');
  cy.wrap(subject).should('not.contain', 'Loading...');
  return cy.wrap(subject);
});

// Network utilities
Cypress.Commands.add('mockApiError', (endpoint, statusCode = 500) => {
  cy.intercept('*', endpoint, {
    statusCode,
    body: { error: 'Internal Server Error' }
  }).as('apiError');
});

// Accessibility testing
Cypress.Commands.add('checkA11y', (context = null, options = null) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

// Performance testing
Cypress.Commands.add('measurePerformance', (name) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-start`);
  });
});

Cypress.Commands.add('endPerformanceMeasure', (name) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-end`);
    win.performance.measure(name, `${name}-start`, `${name}-end`);
    const measure = win.performance.getEntriesByName(name)[0];
    cy.log(`Performance: ${name} took ${measure.duration}ms`);
  });
});

// Mobile testing utilities
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone SE
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720); // Desktop
});