const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Base URL for the application
    baseUrl: 'http://localhost:3000',
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Test files location
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Support file
    supportFile: 'cypress/support/e2e.js',
    
    // Fixtures folder
    fixturesFolder: 'cypress/fixtures',
    
    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    
    // Video recording
    video: true,
    videoCompression: 32,
    
    // Screenshot settings
    screenshotOnRunFailure: true,
    
    // Test isolation
    testIsolation: true,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Retry settings
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:3000/api',
      coverage: false
    },
    
    // Setup node events
    setupNodeEvents(on, config) {
      // implement node event listeners here
      
      // Code coverage (if needed)
      // require('@cypress/code-coverage/task')(on, config);
      
      // Custom tasks
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        // Database seeding task
        seedDatabase() {
          // Add database seeding logic here
          return null;
        },
        
        // Clear database task
        clearDatabase() {
          // Add database clearing logic here
          return null;
        }
      });
      
      return config;
    },
    
    // Exclude certain files
    excludeSpecPattern: [
      '**/__tests__/**/*',
      '**/*.test.*',
      '**/*.spec.*'
    ]
  },
  
  component: {
    // Component testing configuration
    devServer: {
      framework: 'next',
      bundler: 'webpack'
    },
    
    // Viewport settings for component tests
    viewportWidth: 1000,
    viewportHeight: 660,
    
    // Component test files
    specPattern: 'components/**/*.cy.{js,jsx,ts,tsx}',
    
    // Support file for component tests
    supportFile: 'cypress/support/component.js',
    
    // Index HTML template
    indexHtmlFile: 'cypress/support/component-index.html'
  },
  
  // Global settings
  chromeWebSecurity: false,
  modifyObstructiveCode: false,
  
  // Experimental features
  experimentalStudio: true,
  experimentalWebKitSupport: false,
  
  // Node version
  nodeVersion: 'system',
  
  // Reporter options
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'cypress/reporter-config.json'
  }
});