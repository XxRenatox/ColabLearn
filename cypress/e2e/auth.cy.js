describe('Autenticación', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('debe mostrar el formulario de login', () => {
    cy.contains('Iniciar Sesión').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('debe validar campos requeridos', () => {
    cy.get('button[type="submit"]').click();
    cy.contains(/correo electrónico es requerido/i).should('be.visible');
  });

  it('debe validar formato de email', () => {
    cy.get('input[type="email"]').type('invalid-email');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.contains(/correo electrónico no es válido/i).should('be.visible');
  });

  it('debe iniciar sesión exitosamente', () => {
    cy.fixture('testUser').then((user) => {
      cy.get('input[type="email"]').type(user.email);
      cy.get('input[type="password"]').type(user.password);
      cy.get('button[type="submit"]').click();
      
      // Esperar a que se complete el login
      cy.url().should('include', '/dashboard');
      cy.contains('Dashboard').should('be.visible');
    });
  });

  it('debe mostrar error con credenciales incorrectas', () => {
    cy.get('input[type="email"]').type('wrong@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    cy.contains(/credenciales inválidas|error al iniciar sesión/i).should('be.visible');
  });
});

