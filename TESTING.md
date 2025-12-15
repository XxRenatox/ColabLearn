# Guía de Testing - ColabLearn

Esta guía explica cómo ejecutar y escribir tests para el proyecto ColabLearn.

## Estructura de Testing

El proyecto utiliza dos herramientas principales de testing:

- **Jest**: Para tests unitarios e integración (Frontend y Backend)
- **Cypress**: Para tests end-to-end (E2E)

## Instalación

Primero, instala todas las dependencias:

```bash
npm run install:all
```

O manualmente:

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install

# Root (para Cypress)
npm install
```

## Tests Unitarios e Integración (Jest)

### Frontend

Los tests del frontend están ubicados en `frontend/src/**/__tests__/` o `frontend/src/**/*.test.jsx`.

**Ejecutar tests:**
```bash
cd frontend
npm test                    # Ejecutar una vez
npm run test:watch         # Modo watch (se re-ejecuta al cambiar archivos)
npm run test:coverage      # Con reporte de cobertura
```

**Ejemplos de tests:**
- `frontend/src/pages/__tests__/SettingsPage.test.jsx` - Tests de la página de configuración
- `frontend/src/components/ui/forms/__tests__/LoginForm.test.jsx` - Tests del formulario de login

### Backend

Los tests del backend están ubicados en `backend/tests/`.

**Ejecutar tests:**
```bash
cd backend
npm test                    # Ejecutar una vez
npm run test:watch         # Modo watch
npm run test:coverage      # Con reporte de cobertura
```

**Ejemplos de tests:**
- `backend/tests/routes/auth.test.js` - Tests de autenticación
- `backend/tests/routes/users.test.js` - Tests de usuarios

## Tests E2E (Cypress)

Los tests E2E están ubicados en `cypress/e2e/`.

**Ejecutar tests:**
```bash
# Desde la raíz del proyecto
npm run test:e2e          # Ejecutar en modo headless (CI)
npm run test:e2e:open      # Abrir interfaz gráfica de Cypress
```

**Ejemplos de tests E2E:**
- `cypress/e2e/auth.cy.js` - Flujo completo de autenticación
- `cypress/e2e/settings.cy.js` - Flujo de configuración de usuario
- `cypress/e2e/dashboard.cy.js` - Navegación del dashboard

### Configuración de Cypress

Antes de ejecutar tests E2E, asegúrate de que:

1. El frontend esté corriendo en `http://localhost:5173`
2. El backend esté corriendo en `http://localhost:5000`
3. Tengas un usuario de prueba creado (o usa el fixture `cypress/fixtures/testUser.json`)

## Ejecutar Todos los Tests

Desde la raíz del proyecto:

```bash
npm test                   # Ejecuta todos los tests (frontend + backend)
npm run test:coverage     # Con reporte de cobertura
npm run test:e2e          # Solo tests E2E
```

## Escribir Nuevos Tests

### Test Unitario Frontend (Jest + React Testing Library)

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('debe renderizar correctamente', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('debe manejar clicks', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Test Backend (Jest + Supertest)

```javascript
import request from 'supertest';
import express from 'express';
import myRoutes from '../../routes/myRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/my', myRoutes);

describe('My Routes', () => {
  it('debe responder 200', async () => {
    const response = await request(app)
      .get('/api/my/endpoint')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

### Test E2E (Cypress)

```javascript
describe('Mi Funcionalidad', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password');
    cy.visit('/mi-pagina');
  });

  it('debe mostrar el contenido', () => {
    cy.contains('Mi Contenido').should('be.visible');
  });

  it('debe interactuar con elementos', () => {
    cy.get('button').click();
    cy.contains('Éxito').should('be.visible');
  });
});
```

## Comandos Útiles de Cypress

Cypress incluye comandos personalizados:

- `cy.login(email, password)` - Iniciar sesión
- `cy.logout()` - Cerrar sesión
- `cy.createTestUser(userData)` - Crear usuario de prueba
- `cy.waitForAPI(alias)` - Esperar respuesta de API

## Cobertura de Código

Para ver el reporte de cobertura:

```bash
# Frontend
cd frontend && npm run test:coverage
# Abre frontend/coverage/lcov-report/index.html

# Backend
cd backend && npm run test:coverage
# Abre backend/coverage/lcov-report/index.html
```

## Mejores Prácticas

1. **Tests Unitarios**: Prueban componentes/funciones de forma aislada
2. **Tests de Integración**: Prueban la interacción entre componentes/servicios
3. **Tests E2E**: Prueban flujos completos de usuario
4. **Mocking**: Usa mocks para dependencias externas (APIs, base de datos)
5. **Nombres descriptivos**: Los nombres de tests deben describir qué prueban
6. **AAA Pattern**: Arrange (preparar), Act (ejecutar), Assert (verificar)

## Troubleshooting

### Error: "Cannot find module"
Asegúrate de haber instalado todas las dependencias con `npm run install:all`.

### Error: "Port already in use"
Cierra otros procesos que estén usando los puertos 5173 (frontend) o 5000 (backend).

### Tests E2E fallan
Verifica que tanto el frontend como el backend estén corriendo antes de ejecutar Cypress.

### Tests de backend fallan
Asegúrate de tener configuradas las variables de entorno de test en `backend/tests/setup.js`.

## CI/CD

Para integrar en CI/CD, usa:

```bash
# Tests en modo CI (sin watch, con coverage)
npm run test:frontend:coverage
npm run test:backend:coverage
npm run test:e2e
```

