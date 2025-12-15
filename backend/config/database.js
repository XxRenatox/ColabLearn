const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Cliente de Supabase para operaciones generales
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Cliente de Supabase con permisos administrativos
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Función para crear cliente Supabase autenticado como usuario específico
const createAuthenticatedClient = async (accessToken) => {
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Establecer la sesión con el token JWT
  await client.auth.setSession({
    access_token: accessToken,
    refresh_token: null // No necesitamos refresh token para operaciones del servidor
  });

  return client;
};

const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};

// Función helper para manejar errores de Supabase
const handleSupabaseError = (error) => {
  // Mapear errores comunes
  const errorMap = {
    '23505': { code: 409, message: 'El registro ya existe' },
    '23503': { code: 400, message: 'Referencia no válida' },
    '23514': { code: 400, message: 'Datos no válidos' },
    '42P01': { code: 500, message: 'Tabla no encontrada' },
    'PGRST116': { code: 404, message: 'Recurso no encontrado' }
  };

  const mappedError = errorMap[error.code] || errorMap[error.error_description];

  return {
    code: mappedError?.code || 500,
    message: mappedError?.message || error.message || 'Error interno del servidor'
  };
};

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  handleSupabaseError,
  createAuthenticatedClient
};