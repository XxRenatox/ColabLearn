# 🧪 Configuración de Testing - ColabLearn

## ✅ Configuración Completada

He configurado un sistema completo de testing para tu proyecto con:

### 📦 **Jest** (Tests Unitarios e Integración)
- ✅ Frontend: Configurado con React Testing Library
- ✅ Backend: Configurado con Supertest
- ✅ Scripts de ejecución y cobertura

### 🌐 **Cypress** (Tests E2E)
- ✅ Configuración completa
- ✅ Comandos personalizados (login, logout, etc.)
- ✅ Fixtures de datos de prueba

## 🚀 Instalación Rápida

```bash
# Instalar todas las dependencias
npm run install:all

# O manualmente:
cd frontend && npm install
cd ../backend && npm install
cd .. && npm install  # Para Cypress
```

## 📝 Comandos Disponibles

### Desde la raíz del proyecto:

```bash
# Todos los tests
npm test                    # Frontend + Backend
npm run test:coverage      # Con cobertura

# Tests específicos
npm run test:frontend      # Solo frontend
npm run test:backend       # Solo backend
npm run test:e2e          # Solo Cypress (headless)
npm run test:e2e:open     # Cypress con interfaz gráfica
```

### Desde cada carpeta:

**Frontend:**
```bash
cd frontend
npm test                    # Ejecutar tests
npm run test:watch         # Modo watch
npm run test:coverage      # Con cobertura
```

**Backend:**
```bash
cd backend
npm test                    # Ejecutar tests
npm run test:watch         # Modo watch
npm run test:coverage      # Con cobertura
```

## 📁 Estructura de Tests

```
proyecto-integracion/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── __tests__/
│   │   │       └── SettingsPage.test.jsx
│   │   └── components/
│   │       └── ui/forms/__tests__/
│   │           └── LoginForm.test.jsx
│   ├── jest.config.js
│   ├── babel.config.js
│   └── src/setupTests.js
│
├── backend/
│   ├── tests/
│   │   ├── routes/
│   │   │   ├── auth.test.js
│   │   │   └── users.test.js
│   │   └── setup.js
│   └── jest.config.js
│
└── cypress/
    ├── e2e/
    │   ├── auth.cy.js
    │   ├── settings.cy.js
    │   └── dashboard.cy.js
    ├── fixtures/
    │   └── testUser.json
    └── support/
        ├── commands.js
        └── e2e.js
```

## 🎯 Tests Incluidos

### Frontend (Jest + React Testing Library)
- ✅ **SettingsPage.test.jsx**: Tests de la página de configuración
  - Renderizado inicial
  - Edición de perfil
  - Cambio de contraseña
  - Validaciones

- ✅ **LoginForm.test.jsx**: Tests del formulario de login
  - Validación de campos
  - Validación de email
  - Interacciones del usuario

### Backend (Jest + Supertest)
- ✅ **auth.test.js**: Tests de autenticación
  - Registro de usuarios
  - Login
  - Validaciones

- ✅ **users.test.js**: Tests de usuarios
  - Obtener perfil
  - Actualizar perfil
  - Cambiar contraseña

### E2E (Cypress)
- ✅ **auth.cy.js**: Flujo completo de autenticación
- ✅ **settings.cy.js**: Flujo de configuración
- ✅ **dashboard.cy.js**: Navegación del dashboard

## 🔧 Configuración de Variables de Entorno

Para los tests del backend, asegúrate de tener en `backend/.env.test`:

```env
NODE_ENV=test
JWT_SECRET=test-secret-key
JWT_REFRESH_SECRET=test-refresh-secret-key
```

## 📊 Ver Cobertura

Después de ejecutar `npm run test:coverage`, abre:

- **Frontend**: `frontend/coverage/lcov-report/index.html`
- **Backend**: `backend/coverage/lcov-report/index.html`

## 🎨 Ejecutar Tests E2E

1. **Inicia los servidores:**
```bash
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - Backend
cd backend && npm run dev
```

2. **Ejecuta Cypress:**
```bash
# Desde la raíz
npm run test:e2e:open
```

3. **O en modo headless (CI):**
```bash
npm run test:e2e
```

## 💡 Próximos Pasos

1. **Agregar más tests unitarios** para otros componentes
2. **Expandir tests de integración** para más endpoints
3. **Agregar más flujos E2E** (crear grupos, sesiones, etc.)
4. **Configurar CI/CD** para ejecutar tests automáticamente

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Cypress Documentation](https://docs.cypress.io/)
- [Supertest](https://github.com/visionmedia/supertest)

## ⚠️ Notas Importantes

1. Los tests del backend usan **CommonJS** (require/module.exports)
2. Los tests del frontend usan **ES Modules** (import/export)
3. Asegúrate de tener usuarios de prueba en la base de datos para tests E2E
4. Los mocks de Supabase están configurados en los tests del backend

¡Listo para empezar a testear! 🎉

