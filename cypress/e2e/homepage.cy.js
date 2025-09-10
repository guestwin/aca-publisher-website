// Homepage E2E Tests
describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the homepage successfully', () => {
    cy.get('h1').should('be.visible');
    cy.title().should('not.be.empty');
  });

  it('should have proper navigation', () => {
    // Check if navigation elements exist
    cy.get('nav').should('be.visible');
    
    // Check for common navigation links
    cy.get('a[href="/"]').should('exist');
  });

  it('should be responsive', () => {
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.get('body').should('be.visible');
    
    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.get('body').should('be.visible');
    
    // Test desktop viewport
    cy.viewport(1920, 1080);
    cy.get('body').should('be.visible');
  });

  it('should have proper meta tags for SEO', () => {
    cy.get('head meta[name="description"]').should('exist');
    cy.get('head meta[name="viewport"]').should('exist');
  });

  it('should load without console errors', () => {
    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('consoleError');
    });
    
    cy.visit('/');
    cy.get('@consoleError').should('not.have.been.called');
  });

  it('should have proper accessibility', () => {
    // Check for basic accessibility features
    cy.get('html').should('have.attr', 'lang');
    cy.get('main').should('exist');
  });
});