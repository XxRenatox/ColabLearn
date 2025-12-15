describe('Dashboard', () => {
  beforeEach(() => {
    cy.fixture('testUser').then((user) => {
      cy.login(user.email, user.password);
    });
    cy.visit('/dashboard');
  });

  it('debe mostrar el dashboard después del login', () => {
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('debe mostrar la información del usuario en el sidebar', () => {
    cy.fixture('testUser').then((user) => {
      cy.contains(user.name).should('be.visible');
    });
  });

  it('debe navegar a la página de configuración desde el sidebar', () => {
    cy.contains('Configuración').click();
    cy.url().should('include', '/settings');
    cy.contains('Configuración').should('be.visible');
  });

  it('debe mostrar las secciones principales del dashboard', () => {
    cy.contains(/grupos|sesiones|calendario/i).should('be.visible');
  });

  it('debe cerrar sesión correctamente', () => {
    cy.get('button').contains(/cerrar sesión/i).click();
    cy.url().should('include', '/login');
  });
});

