const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function migrate() {
    console.log('Iniciando migración de constraint de estado de miembros...');

    try {
        // 1. Eliminar constraint existente
        const { error: dropError } = await supabaseAdmin.rpc('exec_sql', {
            query: `ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_status_check;`
        });

        if (dropError) {
            // Fallback si RPC no está habilitado o falla, intentamos una query directa si fuera posible, 
            // pero con Supabase JS client standard no podemos correr DDL arbitrario fácilmente sin una función RPC.
            // Asumiremos que el usuario tiene una función helper 'exec_sql' o similar, 
            // o usaremos una función RPC custom si existe.
            // Si no, reportaremos que se debe correr manual.
            console.warn('Advertencia: No se pudo ejecutar vía RPC exec_sql. Intentando método alternativo o informando error.');
            console.error('Error detalle:', dropError);
        }

        // 2. Crear nueva constraint
        const { error: addError } = await supabaseAdmin.rpc('exec_sql', {
            query: `ALTER TABLE group_members ADD CONSTRAINT group_members_status_check CHECK (status IN ('active', 'inactive', 'banned', 'pending'));`
        });

        if (addError) {
            console.error('Error agregando constraint:', addError);
        } else {
            console.log('✅ Constraint actualizado exitosamente.');
        }

    } catch (err) {
        console.error('Error inesperado:', err);
    }
}

// Si no existe la función RPC exec_sql, tendremos que usar pg directamente o instruir al usuario.
// Vamos a intentar verificar si podemos usar el endpoint rest para SQL si está habilitado (raro)
// O mejor, informamos al usuario que ejecute el SQL en su dashboard si el script falla.

// Como alternativa, si el backend tiene un `db.js` con acceso directo a pool de postgres, sería mejor.
// Revisemos imports en el proyecto.
// El proyecto usa supabase-js.

migrate();
