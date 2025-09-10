// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Authentication Commands
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/auth');
    cy.get('[data-cy="email-input"]').type(email);
    cy.get('[data-cy="password-input"]').type(password);
    cy.get('[data-cy="login-button"]').click();
    cy.url().should('not.include', '/auth');
    cy.getCookie('token').should('exist');
  });
});

Cypress.Commands.add('register', (userData) => {
  const {
    name = 'Test User',
    email = 'test@example.com',
    password = 'password123',
    confirmPassword = 'password123'
  } = userData;
  
  cy.visit('/auth');
  cy.get('[data-cy="register-tab"]').click();
  cy.get('[data-cy="name-input"]').type(name);
  cy.get('[data-cy="email-input"]').type(email);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="confirm-password-input"]').type(confirmPassword);
  cy.get('[data-cy="register-button"]').click();
});

// Form Commands
Cypress.Commands.add('fillForm', (formData) => {
  Object.keys(formData).forEach(key => {
    cy.get(`[data-cy="${key}-input"]`).clear().type(formData[key]);
  });
});

Cypress.Commands.add('submitForm', (formSelector = 'form') => {
  cy.get(formSelector).submit();
});

// Navigation Commands
Cypress.Commands.add('navigateTo', (page) => {
  const routes = {
    home: '/',
    products: '/products',
    cart: '/cart',
    profile: '/profile',
    admin: '/admin',
    auth: '/auth'
  };
  
  cy.visit(routes[page] || page);
});

// Product Commands
Cypress.Commands.add('searchProduct', (query) => {
  cy.get('[data-cy="search-input"]').clear().type(query);
  cy.get('[data-cy="search-button"]').click();
});

Cypress.Commands.add('filterProducts', (filters) => {
  if (filters.category) {
    cy.get('[data-cy="category-filter"]').select(filters.category);
  }
  
  if (filters.priceRange) {
    cy.get('[data-cy="price-min"]').clear().type(filters.priceRange.min);
    cy.get('[data-cy="price-max"]').clear().type(filters.priceRange.max);
  }
  
  if (filters.sortBy) {
    cy.get('[data-cy="sort-select"]').select(filters.sortBy);
  }
  
  cy.get('[data-cy="apply-filters"]').click();
});

// Cart Commands
Cypress.Commands.add('addProductToCart', (productId, quantity = 1) => {
  cy.get(`[data-cy="product-${productId}"]`).within(() => {
    if (quantity > 1) {
      cy.get('[data-cy="quantity-input"]').clear().type(quantity.toString());
    }
    cy.get('[data-cy="add-to-cart"]').click();
  });
});

Cypress.Commands.add('updateCartQuantity', (productId, quantity) => {
  cy.get(`[data-cy="cart-item-${productId}"]`).within(() => {
    cy.get('[data-cy="quantity-input"]').clear().type(quantity.toString());
    cy.get('[data-cy="update-quantity"]').click();
  });
});

Cypress.Commands.add('removeFromCart', (productId) => {
  cy.get(`[data-cy="cart-item-${productId}"]`).within(() => {
    cy.get('[data-cy="remove-item"]').click();
  });
});

// Checkout Commands
Cypress.Commands.add('proceedToCheckout', () => {
  cy.get('[data-cy="checkout-button"]').click();
});

Cypress.Commands.add('fillShippingInfo', (shippingData) => {
  const {
    fullName = 'John Doe',
    address = '123 Main St',
    city = 'New York',
    postalCode = '10001',
    phone = '1234567890'
  } = shippingData;
  
  cy.get('[data-cy="shipping-name"]').clear().type(fullName);
  cy.get('[data-cy="shipping-address"]').clear().type(address);
  cy.get('[data-cy="shipping-city"]').clear().type(city);
  cy.get('[data-cy="shipping-postal"]').clear().type(postalCode);
  cy.get('[data-cy="shipping-phone"]').clear().type(phone);
});

Cypress.Commands.add('selectPaymentMethod', (method = 'credit-card') => {
  cy.get(`[data-cy="payment-${method}"]`).click();
});

// Admin Commands
Cypress.Commands.add('createProduct', (productData) => {
  const {
    name = 'Test Product',
    description = 'Test Description',
    price = '99.99',
    category = 'electronics',
    stock = '10'
  } = productData;
  
  cy.get('[data-cy="add-product-button"]').click();
  cy.get('[data-cy="product-name"]').type(name);
  cy.get('[data-cy="product-description"]').type(description);
  cy.get('[data-cy="product-price"]').type(price);
  cy.get('[data-cy="product-category"]').select(category);
  cy.get('[data-cy="product-stock"]').type(stock);
  cy.get('[data-cy="save-product"]').click();
});

Cypress.Commands.add('updateProduct', (productId, updates) => {
  cy.get(`[data-cy="edit-product-${productId}"]`).click();
  
  Object.keys(updates).forEach(field => {
    cy.get(`[data-cy="product-${field}"]`).clear().type(updates[field]);
  });
  
  cy.get('[data-cy="save-product"]').click();
});

Cypress.Commands.add('deleteProduct', (productId) => {
  cy.get(`[data-cy="delete-product-${productId}"]`).click();
  cy.get('[data-cy="confirm-delete"]').click();
});

// Utility Commands
Cypress.Commands.add('waitForLoader', () => {
  cy.get('[data-cy="loader"]').should('not.exist');
});

Cypress.Commands.add('checkToast', (message, type = 'success') => {
  cy.get(`[data-cy="toast-${type}"]`).should('be.visible').and('contain', message);
});

Cypress.Commands.add('dismissToast', () => {
  cy.get('[data-cy="toast-close"]').click();
});

Cypress.Commands.add('confirmDialog', (action = 'confirm') => {
  cy.get(`[data-cy="dialog-${action}"]`).click();
});

// File Upload Commands
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'image/jpeg') => {
  cy.get(selector).selectFile({
    contents: Cypress.Buffer.from('file contents'),
    fileName: fileName,
    mimeType: fileType
  });
});

// API Commands
Cypress.Commands.add('apiLogin', (email, password) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password }
  }).then((response) => {
    window.localStorage.setItem('token', response.body.token);
  });
});

Cypress.Commands.add('apiCreateProduct', (productData) => {
  cy.request({
    method: 'POST',
    url: '/api/products',
    body: productData,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('token')}`
    }
  });
});

// Database Commands
Cypress.Commands.add('resetDatabase', () => {
  cy.task('clearDatabase');
  cy.task('seedDatabase');
});

// Responsive Testing Commands
Cypress.Commands.add('testResponsive', (callback) => {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 720, name: 'desktop' }
  ];
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.log(`Testing on ${viewport.name} (${viewport.width}x${viewport.height})`);
    callback(viewport.name);
  });
});

// Performance Commands
Cypress.Commands.add('measureLoadTime', (url) => {
  cy.visit(url, {
    onBeforeLoad: (win) => {
      win.performance.mark('start');
    },
    onLoad: (win) => {
      win.performance.mark('end');
      win.performance.measure('pageLoad', 'start', 'end');
    }
  });
  
  cy.window().then((win) => {
    const measure = win.performance.getEntriesByName('pageLoad')[0];
    cy.log(`Page load time: ${measure.duration}ms`);
    expect(measure.duration).to.be.lessThan(3000); // Should load within 3 seconds
  });
});