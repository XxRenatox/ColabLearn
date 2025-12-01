const { supabase, supabaseAdmin } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

class AuthService {
  // Registrar nuevo usuario
  static async register({ email, password, name, avatar }) {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          avatar: avatar || '👤',
          metadata: {
            university: '',
            career: '',
            semester: '',
            level: 1,
            xp: 0,
            streak: 0
          }
        }
      }
    });

    if (authError) {
      throw new Error(`Error al crear usuario: ${authError.message}`);
    }

    // 2. Crear perfil en la tabla de perfiles (opcional, si necesitas datos adicionales)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        avatar: avatar || '👤',
        created_at: new Date().toISOString()
      }]);

    if (profileError && !profileError.message.includes('duplicate')) {
      // Si hay error al crear el perfil (y no es por duplicado), eliminar el usuario de Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Error al crear perfil: ${profileError.message}`);
    }

    return {
      id: authData.user.id,
      email: authData.user.email,
      name: name.trim(),
      avatar: avatar || '👤',
      ...authData.user.user_metadata.metadata
    };
  }

  // Iniciar sesión
  static async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      throw new Error(`Error al iniciar sesión: ${error.message}`);
    }

    return {
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        ...data.user.user_metadata,
        ...(data.user.user_metadata.metadata || {})
      }
    };
  }

  // Cerrar sesión
  static async logout(accessToken) {
    const { error } = await supabase.auth.admin.signOut(accessToken);
    if (error) throw error;
    return { success: true };
  }

  // Obtener usuario actual
  static async getCurrentUser(accessToken) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error) throw error;
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      ...user.user_metadata,
      ...(user.user_metadata.metadata || {})
    };
  }

  // Actualizar perfil de usuario
  static async updateProfile(userId, updates) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: updates
    });

    if (error) throw error;
    return data.user;
  }
}

module.exports = AuthService;
