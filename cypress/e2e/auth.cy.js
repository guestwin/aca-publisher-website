describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/auth');
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', () => {
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="login-button"]').click();
      
      cy.wait('@login');
      cy.url().should('not.include', '/auth');
      cy.getCookie('token').should('exist');
      
      // Check if user is redirected to dashboard or home
      cy.url().should('match', /\/(dashboard|home|$)/);
    });

    it('should show error with invalid credentials', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { success: false, message: 'Invalid credentials' }
      }).as('loginError');

      cy.get('[data-cy="email-input"]').type('invalid@example.com');
      cy.get('[data-cy="password-input"]').type('wrongpassword');
      cy.get('[data-cy="login-button"]').click();
      
      cy.wait('@loginError');
      cy.checkToast('Invalid credentials', 'error');
      cy.url().should('include', '/auth');
    });

    it('should validate required fields', () => {
      cy.get('[data-cy="login-button"]').click();
      
      cy.get('[data-cy="email-error"]').should('be.visible').and('contain', 'Email is required');
      cy.get('[data-cy="password-error"]').should('be.visible').and('contain', 'Password is required');
    });

    it('should validate email format', () => {
      cy.get('[data-cy="email-input"]').type('invalid-email');
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="login-button"]').click();
      
      cy.get('[data-cy="email-error"]').should('be.visible').and('contain', 'Invalid email format');
    });

    it('should toggle password visibility', () => {
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password');
      cy.get('[data-cy="toggle-password"]').click();
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'text');
      cy.get('[data-cy="toggle-password"]').click();
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Registration', () => {
    beforeEach(() => {
      cy.get('[data-cy="register-tab"]').click();
    });

    it('should register successfully with valid data', () => {
      cy.get('[data-cy="name-input"]').type('New User');
      cy.get('[data-cy="email-input"]').type('newuser@example.com');
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="confirm-password-input"]').type('password123');
      cy.get('[data-cy="register-button"]').click();
      
      cy.wait('@register');
      cy.checkToast('Registration successful', 'success');
    });

    it('should show error when email already exists', () => {
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 409,
        body: { success: false, message: 'Email already exists' }
      }).as('registerError');

      cy.get('[data-cy="name-input"]').type('Test User');
      cy.get('[data-cy="email-input"]').type('existing@example.com');
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="confirm-password-input"]').type('password123');
      cy.get('[data-cy="register-button"]').click();
      
      cy.wait('@registerError');
      cy.checkToast('Email already exists', 'error');
    });

    it('should validate password confirmation', () => {
      cy.get('[data-cy="name-input"]').type('Test User');
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="confirm-password-input"]').type('differentpassword');
      cy.get('[data-cy="register-button"]').click();
      
      cy.get('[data-cy="confirm-password-error"]')
        .should('be.visible')
        .and('contain', 'Passwords do not match');
    });

    it('should validate password strength', () => {
      cy.get('[data-cy="password-input"]').type('weak');
      cy.get('[data-cy="password-strength"]')
        .should('be.visible')
        .and('contain', 'Password is too weak');
      
      cy.get('[data-cy="password-input"]').clear().type('StrongPassword123!');
      cy.get('[data-cy="password-strength"]')
        .should('be.visible')
        .and('contain', 'Strong password');
    });

    it('should validate all required fields', () => {
      cy.get('[data-cy="register-button"]').click();
      
      cy.get('[data-cy="name-error"]').should('be.visible').and('contain', 'Name is required');
      cy.get('[data-cy="email-error"]').should('be.visible').and('contain', 'Email is required');
      cy.get('[data-cy="password-error"]').should('be.visible').and('contain', 'Password is required');
    });
  });

  describe('Forgot Password', () => {
    it('should send reset password email', () => {
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 200,
        body: { success: true, message: 'Reset password email sent' }
      }).as('forgotPassword');

      cy.get('[data-cy="forgot-password-link"]').click();
      cy.get('[data-cy="reset-email-input"]').type('test@example.com');
      cy.get('[data-cy="send-reset-button"]').click();
      
      cy.wait('@forgotPassword');
      cy.checkToast('Reset password email sent', 'success');
    });

    it('should show error for non-existent email', () => {
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 404,
        body: { success: false, message: 'Email not found' }
      }).as('forgotPasswordError');

      cy.get('[data-cy="forgot-password-link"]').click();
      cy.get('[data-cy="reset-email-input"]').type('nonexistent@example.com');
      cy.get('[data-cy="send-reset-button"]').click();
      
      cy.wait('@forgotPasswordError');
      cy.checkToast('Email not found', 'error');
    });
  });

  describe('Social Login', () => {
    it('should handle Google login', () => {
      cy.window().then((win) => {
        cy.stub(win, 'open').as('googleLogin');
      });

      cy.get('[data-cy="google-login"]').click();
      cy.get('@googleLogin').should('have.been.calledWith', 
        Cypress.sinon.match(/accounts\.google\.com/)
      );
    });

    it('should handle Facebook login', () => {
      cy.window().then((win) => {
        cy.stub(win, 'open').as('facebookLogin');
      });

      cy.get('[data-cy="facebook-login"]').click();
      cy.get('@facebookLogin').should('have.been.calledWith', 
        Cypress.sinon.match(/facebook\.com/)
      );
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.setMobileViewport();
      
      cy.get('[data-cy="email-input"]').should('be.visible');
      cy.get('[data-cy="password-input"]').should('be.visible');
      cy.get('[data-cy="login-button"]').should('be.visible');
      
      // Test mobile-specific elements
      cy.get('[data-cy="mobile-menu"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.setTabletViewport();
      
      cy.get('[data-cy="auth-form"]').should('be.visible');
      cy.get('[data-cy="social-login-section"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should support keyboard navigation', () => {
      cy.get('[data-cy="email-input"]').focus().should('be.focused');
      cy.get('[data-cy="email-input"]').tab();
      cy.get('[data-cy="password-input"]').should('be.focused');
      cy.get('[data-cy="password-input"]').tab();
      cy.get('[data-cy="login-button"]').should('be.focused');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-cy="email-input"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="password-input"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="login-button"]').should('have.attr', 'aria-label');
    });
  });
});