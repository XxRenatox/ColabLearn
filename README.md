# ColabLearn - Plataforma de Estudio Colaborativo

## 📋 Descripción

ColabLearn es una plataforma web diseñada para que estudiantes puedan estudiar juntos de manera organizada. La plataforma permite crear grupos de estudio, programar sesiones de estudio, chatear en tiempo real, recibir recomendaciones de grupos compatibles, ganar logros y puntos, y compartir recursos educativos.

## 🚀 Características Principales

- **Grupos de Estudio**: Crea y únete a grupos de estudio según tu universidad, carrera y semestre
- **Sesiones de Estudio**: Programa y gestiona sesiones de estudio con calendario integrado
- **Chat en Tiempo Real**: Comunicación instantánea mediante WebSockets
- **Sistema de Matching**: Recomendaciones inteligentes de grupos compatibles
- **Sistema de Logros**: Gana puntos y logros por tu actividad de estudio
- **Foros**: Discute temas y haz preguntas en foros temáticos
- **Recursos Compartidos**: Comparte y gestiona archivos y recursos de estudio
- **Panel de Administración**: Gestión completa del sistema para administradores

## 🏗️ Arquitectura

### Stack Tecnológico

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Base de Datos**: PostgreSQL (Supabase)
- **ORM/Cliente DB**: @supabase/supabase-js 2.38.0
- **Autenticación**: JWT (jsonwebtoken 9.0.2)
- **WebSockets**: Socket.IO 4.7.2
- **Validación**: express-validator 7.0.1
- **Seguridad**: Helmet 7.0.0, express-rate-limit 6.10.0

#### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.2
- **Routing**: React Router DOM 7.8.0
- **Estilos**: TailwindCSS 4.1.11
- **HTTP Client**: Axios 1.12.2
- **WebSockets**: Socket.IO Client 4.8.1
- **Animaciones**: Framer Motion 12.23.24
- **Iconos**: Lucide React 0.539.0
- **Notificaciones**: React Hot Toast 2.6.0

## 📦 Instalación

### Prerrequisitos

- Node.js (v18 o superior)
- npm o yarn
- PostgreSQL (o cuenta de Supabase)
- Cuenta de Supabase para la base de datos

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/colablearn.git
cd colablearn
```

2. **Instalar dependencias**
```bash
npm run install:all
```

3. **Configurar variables de entorno**

Crear archivo `.env` en la raíz del proyecto:
```env
# Backend
PORT=3000
JWT_SECRET=tu_secret_key_aqui
JWT_REFRESH_SECRET=tu_refresh_secret_key_aqui
SUPABASE_URL=tu_supabase_url
SUPABASE_KEY=tu_supabase_key

# Frontend
VITE_API_URL=http://localhost:3000/api
```

4. **Configurar base de datos**

Ejecutar el script de esquema:
```bash
cd backend
node scripts/schema.sql
```

O importar el esquema manualmente en Supabase.

5. **Iniciar el proyecto**

Para desarrollo (frontend + backend):
```bash
npm run dev
```

Para iniciar solo el frontend:
```bash
npm run dev:frontend
```

Para iniciar solo el backend:
```bash
npm run dev:backend
```

## 📁 Estructura del Proyecto

```
proyecto-integracion/
├── backend/              # Servidor Express.js
│   ├── config/          # Configuración de base de datos
│   ├── middleware/      # Middlewares (auth, error handling)
│   ├── routes/          # Rutas de la API
│   ├── services/        # Servicios de negocio
│   ├── validators/      # Validadores de datos
│   └── scripts/         # Scripts de base de datos
├── frontend/            # Aplicación React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas de la aplicación
│   │   ├── contexts/    # Contextos de React
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # Servicios de API
│   │   └── utils/       # Utilidades
│   └── public/          # Archivos estáticos
└── docs/                # Documentación del proyecto
```

## 🔧 Scripts Disponibles

- `npm run dev`: Inicia frontend y backend en modo desarrollo
- `npm run dev:frontend`: Inicia solo el frontend
- `npm run dev:backend`: Inicia solo el backend
- `npm run build`: Construye el frontend para producción
- `npm run start`: Inicia el backend en modo producción
- `npm run install:all`: Instala todas las dependencias del proyecto

## 📚 Documentación

La documentación completa del proyecto se encuentra en la carpeta `docs/`:
- `RESUMEN_PROYECTO_COMPLETO.md`: Resumen completo del proyecto
- `ANALISIS_REQUERIMIENTOS.md`: Análisis de requerimientos
- `MATCHING_ALGORITHM.md`: Algoritmo de matching
- Y más...

## 🔐 Seguridad

- Autenticación mediante JWT
- Refresh tokens para renovación automática
- Rate limiting para prevenir abusos
- Validación de datos en backend y frontend
- Helmet para seguridad HTTP

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## 👥 Autores

ColabLearn Team

## 🙏 Agradecimientos

- Supabase por el servicio de base de datos
- La comunidad de código abierto por las librerías utilizadas

