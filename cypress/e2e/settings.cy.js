describe('Página de Configuración', () => {
  beforeEach(() => {
    cy.fixture('testUser').then((user) => {
      cy.login(user.email, user.password);
    });
    cy.visit('/settings');
  });

  it('debe mostrar la página de configuración', () => {
    cy.contains('Configuración').should('be.visible');
    cy.contains('Perfil').should('be.visible');
    cy.contains('Contraseña').should('be.visible');
  });

  it('debe mostrar la información del usuario', () => {
    cy.fixture('testUser').then((user) => {
      cy.get('input[value*="' + user.name + '"]').should('exist');
      cy.get('input[value*="' + user.email + '"]').should('exist');
    });
  });

  it('debe permitir editar el perfil', () => {
    cy.get('input[placeholder*="Nombre completo"]').clear().type('Nombre Actualizado');
    cy.get('input[placeholder*="Universidad"]').clear().type('Universidad Actualizada');
    cy.contains('Guardar cambios').click();
    
    cy.contains(/perfil actualizado exitosamente/i).should('be.visible');
  });

  it('debe cambiar a la pestaña de contraseña', () => {
    cy.contains('Contraseña').click();
    cy.contains('Cambiar Contraseña').should('be.visible');
    cy.get('input[placeholder*="contraseña actual"]').should('be.visible');
  });

  it('debe validar que las contraseñas coincidan', () => {
    cy.contains('Contraseña').click();
    
    cy.get('input[placeholder*="contraseña actual"]').type('OldPassword123');
    cy.get('input[placeholder*="Mínimo 6 caracteres"]').type('NewPassword123');
    cy.get('input[placeholder*="Confirma tu nueva contraseña"]').type('DifferentPassword');
    
    cy.contains('Cambiar contraseña').click();
    cy.contains(/las contraseñas no coinciden/i).should('be.visible');
  });

  it('debe cambiar la contraseña exitosamente', () => {
    cy.fixture('testUser').then((user) => {
      cy.contains('Contraseña').click();
      
      cy.get('input[placeholder*="contraseña actual"]').type(user.password);
      cy.get('input[placeholder*="Mínimo 6 caracteres"]').type('NewPassword123!');
      cy.get('input[placeholder*="Confirma tu nueva contraseña"]').type('NewPassword123!');
      
      cy.contains('Cambiar contraseña').click();
      cy.contains(/contraseña actualizada exitosamente/i).should('be.visible');
    });
  });

  it('debe mostrar/ocultar contraseñas', () => {
    cy.contains('Contraseña').click();
    
    const passwordInput = cy.get('input[placeholder*="contraseña actual"]');
    passwordInput.should('have.attr', 'type', 'password');
    
    // Click en el botón de mostrar/ocultar
    passwordInput.parent().find('button').click();
    passwordInput.should('have.attr', 'type', 'text');
  });
});

