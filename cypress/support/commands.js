// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Login helper command
 * @param {string} email - User email
 * @param {string} password - User password
 */
Cypress.Commands.add('login', (email = 'test@example.com', password = 'Test123456!') => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email,
      password,
    },
  }).then((response) => {
    const token = response.body.data?.token || response.body.token;
    if (token) {
      window.localStorage.setItem('auth_token', token);
    }
  });
});

/**
 * Logout helper command
 */
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('auth_token');
  cy.visit('/login');
});

/**
 * Create test user helper
 */
Cypress.Commands.add('createTestUser', (userData) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: userData,
    failOnStatusCode: false,
  });
});

/**
 * Wait for API response
 */
Cypress.Commands.add('waitForAPI', (alias) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201]);
  });
});

