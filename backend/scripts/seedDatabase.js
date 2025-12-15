/**
 * 🌱 ColabLearn - Seed Database
 * Script integral para poblar la base con datos de prueba realistas.
 *
 * Requisitos:
 *  - Definir SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env
 *  - (Opcional) SEED_EMAIL_DOMAIN y SEED_USER_PASSWORD
 */

const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
});
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Falta la variable de entorno ${key}`);
    process.exit(1);
  }
});

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const SEED_EMAIL_DOMAIN = (process.env.SEED_EMAIL_DOMAIN || 'seed.colablearn.com').toLowerCase();
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'Password123!';

const USERS_TO_CREATE = 30;
const GROUPS_TO_CREATE = 20;
const MEMBERS_PER_GROUP = 6;
const SESSIONS_PER_GROUP = 2;
const MESSAGES_PER_GROUP = 10;
const FORUMS_TO_CREATE = 12;
const POSTS_PER_FORUM = 3;
const REPLIES_PER_POST = 2;
const NOTIFICATIONS_PER_USER = 3;
const FILES_TO_CREATE = 24;
const ACHIEVEMENTS_TO_CREATE = 20;

const firstNames = [
  'Renato', 'María', 'Camila', 'Felipe', 'Valentina', 'Javier', 'Constanza', 'Matías', 'Fernanda', 'Sebastián',
  'Ignacio', 'Daniela', 'Pablo', 'Catalina', 'Tomás', 'Isidora', 'Nicolás', 'Antonia', 'Benjamín', 'Francisca',
  'Rodrigo', 'Javiera', 'Gonzalo', 'Carolina', 'Vicente', 'Alejandra', 'Andrés', 'Paula', 'Diego', 'Rocío',
];

const lastNames = [
  'Benavente', 'González', 'López', 'Morales', 'Silva', 'Rojas', 'Muñoz', 'Hernández', 'Torres', 'Flores',
  'Pérez', 'Soto', 'Contreras', 'Jara', 'Navarro', 'Romero', 'Valdés', 'Araya', 'Cortés', 'Vargas',
];

const universities = [
  'Universidad de Chile',
  'Pontificia Universidad Católica de Chile',
  'Universidad de Santiago',
  'Universidad de Concepción',
  'Universidad Técnica Federico Santa María',
  'Universidad Austral de Chile',
];

const careers = [
  'Ingeniería Informática',
  'Medicina',
  'Derecho',
  'Ingeniería Comercial',
  'Arquitectura',
  'Psicología',
  'Diseño',
  'Periodismo',
  'Economía',
  'Ingeniería Civil',
];

const subjects = [
  'Programación Avanzada', 'Anatomía', 'Derecho Penal', 'Finanzas Corporativas', 'Bases de Datos', 'Psicología Social',
  'Diseño UX', 'Macroeconomía', 'Cálculo Integral', 'Electromagnetismo', 'Biomecánica', 'Marketing Digital',
  'Inteligencia Artificial', 'Bioquímica', 'Historia Contemporánea', 'Sistemas Operativos', 'Redes Neuronales',
  'Ética Profesional', 'Metodologías Ágiles', 'Gestión de Proyectos',
];

// Avatares ahora se generan usando DiceBear, no emojis
const avatarStyles = ['adventurer', 'avataaars', 'big-smile', 'bottts', 'fun-emoji', 'icons', 'identicon', 'lorelei', 'micah', 'miniavs', 'open-peeps', 'personas', 'pixel-art', 'shapes', 'thumbs'];
const semesters = ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°'];
const timezones = ['America/Santiago', 'America/Argentina/Buenos_Aires', 'America/Lima', 'America/Bogota'];
const notificationTypes = ['group_invite', 'session_reminder', 'achievement_unlock', 'system'];
const forumStatuses = ['active', 'archived'];
const resourceTypes = ['guide', 'document', 'link', 'exercise', 'material_theory', 'video', 'tool', 'other'];
const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-teal-500'];

// Preferencias de matching
const preferredTimes = ['morning', 'afternoon', 'evening', 'night'];
const groupSizes = ['individual', 'small', 'medium', 'large'];
const studyStyles = ['visual', 'auditivo', 'kinestesico', 'lectura'];
const sessionDurations = ['30min', '1h', '2h', '3h+'];
const studyFrequencies = ['casual', 'regular', 'intenso'];
const communicationStyles = ['directo', 'amigable', 'formal'];
const personalityTraits = ['extrovertido', 'introvertido', 'competitivo', 'colaborativo', 'organizado', 'flexible', 'paciente', 'motivador'];
const goals = ['notas', 'habitos', 'amigos', 'motivacion', 'disciplina', 'examenes'];
const studyLocations = ['casa', 'biblioteca', 'cafe', 'universidad', 'online', 'parque'];
const noiseLevels = ['silencio', 'bajo', 'alto'];
const weekDaysOptions = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const timeSlotsOptions = ['morning', 'afternoon', 'evening', 'late'];

// Bios de ejemplo para los usuarios
const bios = [
  'Estudiante apasionado por aprender y compartir conocimiento. Me encanta estudiar en grupo y ayudar a otros.',
  'Busco mejorar mis hábitos de estudio y encontrar compañeros motivados. Disfruto de las sesiones colaborativas.',
  'Soy organizado y me gusta mantener un ritmo constante de estudio. Prefiero grupos pequeños para mayor enfoque.',
  'Estudiante activo que busca prepararse bien para los exámenes. Me motiva la competencia sana y el progreso.',
  'Amo estudiar y aprender cosas nuevas. Busco compañeros con los que pueda tener buenas discusiones académicas.',
  'Me gusta el estudio estructurado pero también disfruto de la flexibilidad. Adaptable y abierto a nuevas formas de aprender.',
  'Estudiante dedicado que busca mejorar constantemente. Prefiero ambientes tranquilos para concentrarme mejor.',
  'Me encanta compartir conocimientos y ayudar a otros a entender conceptos difíciles. Paciente y colaborativo.',
];

const randomItem = (array) => array[Math.floor(Math.random() * array.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const slugify = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const uniquePick = (array, count, excludeIds = new Set()) => {
  const pool = array.filter((item) => !excludeIds.has(item.id));
  if (pool.length <= count) {
    return [...pool];
  }
  const working = [...pool];
  const selected = [];
  while (selected.length < count && working.length > 0) {
    const index = randomInt(0, working.length - 1);
    selected.push(working.splice(index, 1)[0]);
  }
  return selected;
};

const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
};

async function deleteSeedAuthUsers() {
  console.log('🧹 Eliminando usuarios de Supabase Auth del dominio seed...');
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('❌ Error listando usuarios:', error.message);
      break;
    }

    const seedUsers = data.users.filter(
      (user) => (user.email && user.email.toLowerCase().endsWith(`@${SEED_EMAIL_DOMAIN}`)) || user.email === 'test@example.com'
    );

    for (const user of seedUsers) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`  No se pudo eliminar usuario ${user.email}: ${deleteError.message}`);
      } else {
        console.log(`  ✅ Usuario eliminado de Auth: ${user.email}`);
      }
    }

    if (data.users.length < perPage) {
      break;
    }
    page += 1;
  }
}

async function resetTables() {
  console.log('\nLimpiando tablas...');
  const tables = [
    'message_reads',
    'messages',
    'forum_likes',
    'forum_replies',
    'forum_posts',
    'forums',
    'file_downloads',
    'files',
    'notifications',
    'user_achievements',
    'session_feedback',
    'session_attendance',
    'calendar_events',
    'sessions',
    'group_members',
    'groups',
    'achievements',
    'users',
  ];

  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.error(`  No se pudo vaciar ${table}: ${error.message}`);
      } else {
        console.log(`  Tabla limpiada: ${table}`);
      }
    } catch (err) {
      console.error(`  Error limpiando ${table}: ${err.message}`);
    }
  }
}

async function createUsers() {
  console.log('\nCreando usuarios...');
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, 12);
  const usersPayload = [];
  const createdUsersMeta = [];

  // Crear usuario de prueba fijo para Cypress
  const testUserEmail = 'test@example.com';
  const testUserPassword = 'Test123456!';
  const testUserHash = await bcrypt.hash(testUserPassword, 12);

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testUserEmail,
      password: testUserPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        avatar: null,
        avatarStyle: 'adventurer',
        university: 'Universidad de Prueba',
        career: 'Ingeniería en Pruebas',
      },
    });

    if (!authError && authData?.user) {
      usersPayload.push({
        id: authData.user.id,
        email: testUserEmail,
        password_hash: testUserHash,
        name: 'Test User',
        avatar: null,
        university: 'Universidad de Prueba',
        career: 'Ingeniería en Pruebas',
        semester: '5°',
        is_active: true,
        level: 10,
        xp: 500,
        streak: 5,
        study_hours: 100,
        preferences: { bio: 'Usuario de prueba para E2E testing' }
      });
      console.log(`  ✅ Usuario de prueba creado: ${testUserEmail}`);
    } else {
      console.error('Error creando usuario de prueba:', authError);
    }
  } catch (error) {
    console.error('Excepción creando usuario de prueba:', error);
  }

  for (let i = 0; i < USERS_TO_CREATE; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const university = randomItem(universities);
    const career = randomItem(careers);
    const semester = randomItem(semesters);
    const avatarStyle = randomItem(avatarStyles);
    const avatar = null; // Los avatares se generan usando DiceBear con el estilo
    const email = `${slugify(firstName)}.${slugify(lastName)}${i}@${SEED_EMAIL_DOMAIN}`;

    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: SEED_USER_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: fullName,
          avatar: null, // Se generará usando DiceBear
          avatarStyle: avatarStyle, // Estilo de DiceBear
          university,
          career,
        },
      });

      if (authError || !authData?.user) {
        throw authError || new Error('No se pudo crear usuario en Auth');
      }

      usersPayload.push({
        id: authData.user.id,
        email,
        password_hash: passwordHash,
        name: fullName,
        avatar: null, // Los avatares se generan usando DiceBear
        university,
        career,
        semester,
        level: randomInt(1, 15),
        xp: randomInt(100, 1200),
        streak: randomInt(0, 15),
        study_hours: Number((10 + Math.random() * 90).toFixed(1)),
        preferences: {
          // Bio y descripción personal
          bio: randomItem(bios),

          // Objetivos de estudio
          goals: getRandomItems(goals, randomInt(2, 4)),

          // Materias de interés
          subjects: getRandomItems(subjects, randomInt(2, 5)),

          // Configuración de zona horaria
          timezone: randomItem(timezones),

          // Días disponibles
          weekDays: getRandomItems(weekDaysOptions, randomInt(2, 5)),

          // Tamaño de grupo preferido
          groupSize: randomItem(groupSizes),

          // Horarios preferidos
          timeSlots: getRandomItems(timeSlotsOptions, randomInt(1, 3)),

          // Nivel de ruido preferido
          noiseLevel: randomItem(noiseLevels),

          // Estilos de aprendizaje
          studyStyle: getRandomItems(studyStyles, randomInt(1, 3)),

          // Horarios de estudio (para compatibilidad con estructura antigua)
          studyTimes: getRandomItems(preferredTimes, randomInt(1, 2)),

          // Rasgos de personalidad
          personality: getRandomItems(personalityTraits, randomInt(2, 4)),

          // Lugares de estudio preferidos
          studyLocation: getRandomItems(studyLocations, randomInt(2, 4)),

          // Frecuencia de estudio
          studyFrequency: randomItem(studyFrequencies),

          // Duración de sesión
          sessionDuration: randomItem(sessionDurations),

          // Estilo de comunicación
          communicationStyle: randomItem(communicationStyles),

          // Notificaciones (mantener compatibilidad)
          notifications: {
            email: Math.random() > 0.2,
            push: Math.random() > 0.5,
          },
        },
        total_sessions: randomInt(2, 30),
        total_groups: randomInt(1, 8),
        is_active: Math.random() > 0.05,
        email_verified: true,
        last_active: new Date(Date.now() - randomInt(0, 7) * 86400000).toISOString(),
      });

      createdUsersMeta.push({
        id: authData.user.id,
        email,
        name: fullName,
        university,
        career,
        semester,
        avatar,
      });

      console.log(`  Usuario creado: ${fullName} (${email})`);
    } catch (error) {
      console.error(`  ❌ Error creando usuario ${email}: ${error.message}`);
    }
  }

  if (!usersPayload.length) {
    throw new Error('No se pudieron crear usuarios');
  }

  const { data: insertedUsers, error } = await supabaseAdmin.from('users').insert(usersPayload).select();
  if (error) {
    throw new Error(`No se pudieron insertar usuarios en la tabla: ${error.message}`);
  }

  const usersById = new Map();
  insertedUsers.forEach((user) => {
    usersById.set(user.id, user);
  });

  console.log(`Usuarios insertados: ${insertedUsers.length}`);
  return insertedUsers.map((user) => ({
    ...user,
    avatar: usersById.get(user.id)?.avatar,
  }));
}

async function createAchievements() {
  console.log('\nCreando logros genéricos...');
  const categories = ['study', 'engagement', 'consistency', 'collaboration', 'leadership'];
  const icons = ['star', 'book-open', 'award', 'briefcase', 'target', 'zap', 'smile', 'heart'];
  const rarities = ['common', 'rare', 'epic', 'legendary'];

  // Logros genéricos predefinidos
  const genericAchievements = [
    {
      name: 'Primeros Pasos',
      description: 'Participa en tu primera sesión de estudio',
      icon: 'star',
      category: 'study',
      requirements: { min_sessions: 1 },
      xp_reward: 25,
      rarity: 'common',
    },
    {
      name: 'Estudiante Activo',
      description: 'Participa en 5 sesiones de estudio',
      icon: 'book-open',
      category: 'study',
      requirements: { min_sessions: 5 },
      xp_reward: 50,
      rarity: 'common',
    },
    {
      name: 'Estudiante Dedicado',
      description: 'Participa en 10 sesiones de estudio',
      icon: 'award',
      category: 'study',
      requirements: { min_sessions: 10 },
      xp_reward: 100,
      rarity: 'rare',
    },
    {
      name: 'Maestro del Estudio',
      description: 'Participa en 25 sesiones de estudio',
      icon: 'target',
      category: 'study',
      requirements: { min_sessions: 25 },
      xp_reward: 250,
      rarity: 'epic',
    },
    {
      name: 'Primera Hora',
      description: 'Completa 1 hora de estudio',
      icon: 'star',
      category: 'consistency',
      requirements: { min_study_hours: 1 },
      xp_reward: 30,
      rarity: 'common',
    },
    {
      name: 'Estudiante Consistente',
      description: 'Completa 10 horas de estudio',
      icon: 'book-open',
      category: 'consistency',
      requirements: { min_study_hours: 10 },
      xp_reward: 75,
      rarity: 'rare',
    },
    {
      name: 'Estudiante Ejemplar',
      description: 'Completa 50 horas de estudio',
      icon: 'award',
      category: 'consistency',
      requirements: { min_study_hours: 50 },
      xp_reward: 200,
      rarity: 'epic',
    },
    {
      name: 'Leyenda del Estudio',
      description: 'Completa 100 horas de estudio',
      icon: 'target',
      category: 'consistency',
      requirements: { min_study_hours: 100 },
      xp_reward: 500,
      rarity: 'legendary',
    },
    {
      name: 'Racha Inicial',
      description: 'Mantén una racha de 3 días',
      icon: 'zap',
      category: 'consistency',
      requirements: { min_streak: 3 },
      xp_reward: 40,
      rarity: 'common',
    },
    {
      name: 'Racha Semanal',
      description: 'Mantén una racha de 7 días',
      icon: 'zap',
      category: 'consistency',
      requirements: { min_streak: 7 },
      xp_reward: 100,
      rarity: 'rare',
    },
    {
      name: 'Colaborador',
      description: 'Ayuda a otros estudiantes 5 veces',
      icon: 'heart',
      category: 'collaboration',
      requirements: { min_help_given: 5 },
      xp_reward: 80,
      rarity: 'rare',
    },
    {
      name: 'Gran Colaborador',
      description: 'Ayuda a otros estudiantes 15 veces',
      icon: 'heart',
      category: 'collaboration',
      requirements: { min_help_given: 15 },
      xp_reward: 200,
      rarity: 'epic',
    },
    {
      name: 'Nivel Básico',
      description: 'Alcanza el nivel 5',
      icon: 'star',
      category: 'study',
      requirements: { min_level: 5 },
      xp_reward: 60,
      rarity: 'common',
    },
    {
      name: 'Nivel Intermedio',
      description: 'Alcanza el nivel 10',
      icon: 'award',
      category: 'study',
      requirements: { min_level: 10 },
      xp_reward: 150,
      rarity: 'rare',
    },
    {
      name: 'Nivel Avanzado',
      description: 'Alcanza el nivel 15',
      icon: 'target',
      category: 'study',
      requirements: { min_level: 15 },
      xp_reward: 300,
      rarity: 'epic',
    },
    {
      name: 'Primer Grupo',
      description: 'Únete a tu primer grupo de estudio',
      icon: 'smile',
      category: 'engagement',
      requirements: { min_groups: 1 },
      xp_reward: 35,
      rarity: 'common',
    },
    {
      name: 'Miembro Activo',
      description: 'Únete a 3 grupos de estudio',
      icon: 'book-open',
      category: 'engagement',
      requirements: { min_groups: 3 },
      xp_reward: 70,
      rarity: 'common',
    },
    {
      name: 'Experiencia Acumulada',
      description: 'Acumula 500 puntos de experiencia',
      icon: 'star',
      category: 'study',
      requirements: { min_xp: 500 },
      xp_reward: 50,
      rarity: 'common',
    },
    {
      name: 'Experiencia Avanzada',
      description: 'Acumula 2000 puntos de experiencia',
      icon: 'award',
      category: 'study',
      requirements: { min_xp: 2000 },
      xp_reward: 150,
      rarity: 'rare',
    },
    {
      name: 'Líder Naciente',
      description: 'Organiza 3 sesiones de estudio',
      icon: 'briefcase',
      category: 'leadership',
      requirements: { min_sessions: 3 },
      xp_reward: 100,
      rarity: 'rare',
    },
  ];

  const achievementsPayload = genericAchievements;

  const { data, error } = await supabaseAdmin.from('achievements').insert(achievementsPayload).select();
  if (error) {
    throw new Error(`No se pudieron crear logros: ${error.message}`);
  }
  console.log(`Logros genéricos insertados: ${data.length}`);
  return data;
}

async function createGroupsAndMembers(users) {
  console.log('\nCreando grupos y membresías...');
  const groupsInput = [];
  const membershipPayload = [];

  for (let i = 0; i < GROUPS_TO_CREATE; i++) {
    const creator = randomItem(users);
    const subject = subjects[i % subjects.length];
    const name = `${subject} - ${['Avanzado', 'Colaborativo', 'Pro', 'Master', 'Elite'][i % 5]}`;

    const members = uniquePick(users, MEMBERS_PER_GROUP - 1, new Set([creator.id]));
    const memberIds = [creator.id, ...members.map((m) => m.id)];

    groupsInput.push({
      data: {
        name,
        description: `Grupo de estudio enfocado en ${subject}.`,
        subject,
        university: creator.university,
        career: creator.career,
        semester: creator.semester,
        color: randomItem(colors),
        max_members: randomInt(10, 40),
        is_private: Math.random() > 0.6,
        allow_invites: Math.random() > 0.3,
        require_approval: Math.random() > 0.7,
        creator_id: creator.id,
        total_sessions: randomInt(1, 10),
        total_hours: Number((Math.random() * 80).toFixed(1)),
        average_rating: Number((Math.random() * 5).toFixed(2)),
        progress: randomInt(10, 90),
      },
      adminId: creator.id,
      memberIds,
    });
  }

  const { data: insertedGroups, error } = await supabaseAdmin
    .from('groups')
    .insert(groupsInput.map((item) => item.data))
    .select();
  if (error) {
    throw new Error(`No se pudieron crear los grupos: ${error.message}`);
  }

  const groupMembersMap = new Map();

  insertedGroups.forEach((group, index) => {
    const config = groupsInput[index];
    const uniqueMembers = [...new Set(config.memberIds)];
    const membersEntries = uniqueMembers.map((userId, memberIndex) => ({
      group_id: group.id,
      user_id: userId,
      role: userId === config.adminId ? 'admin' : memberIndex === 1 ? 'moderator' : 'member',
      status: 'active',
      joined_at: new Date(Date.now() - randomInt(0, 15) * 86400000).toISOString(),
    }));
    membershipPayload.push(...membersEntries);
    groupMembersMap.set(group.id, membersEntries.map((entry) => entry.user_id));
  });

  const { error: membershipError } = await supabaseAdmin.from('group_members').insert(membershipPayload);
  if (membershipError) {
    throw new Error(`No se pudieron crear las membresías: ${membershipError.message}`);
  }

  console.log(`Grupos creados: ${insertedGroups.length}`);
  console.log(`👫 Membresías creadas: ${membershipPayload.length}`);

  return { groups: insertedGroups, groupMembersMap };
}

async function createSessions(groups, groupMembersMap) {
  console.log('\nCreando sesiones, asistencia y eventos de calendario...');
  const sessionsPayload = [];
  const attendancePayload = [];
  const calendarPayload = [];
  const feedbackPayload = [];
  let soonSessionsCount = 0;
  const now = new Date();
  const fiveMinutesLater = new Date(now.getTime() + 5 * 60000);

  console.log(`\n🕐 Hora actual del seed: ${now.toISOString()}`);
  console.log(`⏰ Objetivo: 2 sesiones en ${fiveMinutesLater.toISOString()} (5 minutos desde ahora)\n`);

  groups.forEach((group, groupIndex) => {
    for (let i = 0; i < SESSIONS_PER_GROUP; i++) {
      // Asegurar que al menos 2 sesiones estén en 5 minutos
      let scheduled;
      const shouldBeSoon = soonSessionsCount < 2;

      if (shouldBeSoon) {
        // Crear sesión en 5 minutos exactos desde ahora
        scheduled = new Date(fiveMinutesLater);
        soonSessionsCount++;
        console.log(`  ⏰ Sesión #${soonSessionsCount} programada en 5 minutos: ${group.subject} - Sesión ${i + 1}`);
        console.log(`     Fecha: ${scheduled.toISOString()}`);
      } else {
        // Resto de sesiones: entre 7 días atrás y 14 días adelante
        const daysOffset = randomInt(-7, 14);
        const hoursOffset = randomInt(1, 6);
        scheduled = new Date(now.getTime() + daysOffset * 86400000 + hoursOffset * 3600000);
      }

      sessionsPayload.push({
        title: `${group.subject} - Sesión ${i + 1}`,
        description: `Revisión de tópicos clave de ${group.subject}.`,
        group_id: group.id,
        organizer_id: group.creator_id,
        type: randomItem(['study', 'review', 'project', 'discussion']),
        scheduled_date: scheduled.toISOString(),
        duration: randomInt(60, 150),
        timezone: randomItem(timezones),
        location_type: Math.random() > 0.4 ? 'virtual' : 'physical',
        location_details: Math.random() > 0.5 ? 'Google Meet' : 'Sala 301, Campus San Joaquín',
        location_room: 'Sala ' + randomInt(100, 405),
        platform: 'Teams/Meet',
        max_attendees: randomInt(10, 35),
        status: shouldBeSoon ? 'scheduled' : randomItem(['scheduled', 'in_progress', 'completed']),
        agenda: [
          { title: 'Introducción', duration: 15 },
          { title: 'Tema principal', duration: 45 },
          { title: 'Discusión', duration: 20 },
        ],
        resources: [
          { type: 'link', value: 'https://colablearn.cl/recursos/' + slugify(group.subject) },
        ],
        session_notes: {
          summary: 'Sesión enfocada en resolver dudas recurrentes.',
        },
      });
    }
  });

  console.log(`\n📝 Total de sesiones a crear: ${sessionsPayload.length}`);
  console.log(`⏰ Sesiones próximas (5 minutos): ${soonSessionsCount}`);

  const { data: insertedSessions, error } = await supabaseAdmin.from('sessions').insert(sessionsPayload).select();
  if (error) {
    throw new Error(`No se pudieron crear las sesiones: ${error.message}`);
  }

  // Verificar y mostrar sesiones próximas creadas
  const verificationTime = new Date();
  const fiveMinutesFromNow = verificationTime.getTime() + (5 * 60000);
  const tenMinutesFromNow = verificationTime.getTime() + (10 * 60000);

  const soonSessions = insertedSessions.filter(session => {
    if (!session.scheduled_date) return false;
    const sessionDate = new Date(session.scheduled_date);
    if (isNaN(sessionDate.getTime())) return false;

    const sessionTime = sessionDate.getTime();
    // Buscar sesiones entre ahora y 10 minutos en el futuro
    return sessionTime >= verificationTime.getTime() && sessionTime <= tenMinutesFromNow;
  });

  console.log(`\n📅 Resumen de sesiones próximas (próximos 10 minutos): ${soonSessions.length}`);
  console.log(`⏰ Hora de verificación: ${verificationTime.toISOString()}`);

  if (soonSessions.length > 0) {
    soonSessions.forEach((session, index) => {
      const sessionDate = new Date(session.scheduled_date);
      const minutesUntil = Math.round((sessionDate.getTime() - verificationTime.getTime()) / 60000);
      const hoursUntil = Math.floor(minutesUntil / 60);
      const minsUntil = minutesUntil % 60;
      console.log(`  ${index + 1}. "${session.title}"`);
      console.log(`     Fecha almacenada: ${session.scheduled_date}`);
      console.log(`     Fecha parseada: ${sessionDate.toISOString()}`);
      console.log(`     Tiempo hasta la sesión: ${hoursUntil > 0 ? `${hoursUntil}h ` : ''}${minsUntil}m (${minutesUntil} minutos)`);
    });
  } else {
    console.log(`  ⚠️ No se encontraron sesiones próximas en la verificación.`);
    console.log(`  Verificando primeras 3 sesiones creadas:`);
    insertedSessions.slice(0, 3).forEach((session, index) => {
      const sessionDate = new Date(session.scheduled_date);
      const minutesUntil = Math.round((sessionDate.getTime() - verificationTime.getTime()) / 60000);
      console.log(`  ${index + 1}. "${session.title}" - Fecha: ${session.scheduled_date} (${minutesUntil} minutos desde ahora)`);
    });
  }

  insertedSessions.forEach((session) => {
    const members = groupMembersMap.get(session.group_id) || [];
    const attendees = members.slice(0, Math.min(randomInt(3, members.length), members.length));
    attendees.forEach((userId) => {
      attendancePayload.push({
        session_id: session.id,
        user_id: userId,
        status: randomItem(['confirmed', 'confirmed', 'maybe', 'declined']),
        joined_at: Math.random() > 0.3 ? new Date(new Date(session.scheduled_date).getTime() + randomInt(-5, 10) * 60000).toISOString() : null,
        left_at: Math.random() > 0.5 ? new Date(new Date(session.scheduled_date).getTime() + randomInt(60, 140) * 60000).toISOString() : null,
        actual_duration: randomInt(45, session.duration),
      });
    });

    calendarPayload.push({
      user_id: session.organizer_id,
      title: session.title,
      description: session.description,
      event_type: randomItem(['session', 'exam', 'assignment', 'reminder']),
      start_date: session.scheduled_date,
      end_date: new Date(new Date(session.scheduled_date).getTime() + session.duration * 60000).toISOString(),
      all_day: false,
      timezone: session.timezone,
      session_id: session.id,
      group_id: session.group_id,
      priority: randomItem(['low', 'medium', 'high']),
      color: randomItem(colors),
      location: session.location_details,
      is_recurring: Math.random() > 0.7,
      recurrence_rule: Math.random() > 0.7 ? { frequency: 'weekly', interval: 1 } : null,
    });

    if (Math.random() > 0.6) {
      feedbackPayload.push({
        session_id: session.id,
        user_id: attendees[0] || session.organizer_id,
        rating: randomInt(3, 5),
        comment: 'Sesión muy útil, aclaramos dudas importantes.',
      });
    }
  });

  if (attendancePayload.length) {
    await supabaseAdmin.from('session_attendance').insert(attendancePayload);
  }
  if (calendarPayload.length) {
    await supabaseAdmin.from('calendar_events').insert(calendarPayload);
  }
  if (feedbackPayload.length) {
    await supabaseAdmin.from('session_feedback').insert(feedbackPayload);
  }

  console.log(`Sesiones creadas: ${insertedSessions.length}`);
  console.log(`Registros de asistencia: ${attendancePayload.length}`);
  console.log(`Eventos de calendario: ${calendarPayload.length}`);
  console.log(`Feedback registrado: ${feedbackPayload.length}`);

  return insertedSessions;
}

async function createNotifications(users, sessions) {
  console.log('\nCreando notificaciones...');
  const notificationsPayload = [];

  users.forEach((user) => {
    for (let i = 0; i < NOTIFICATIONS_PER_USER; i++) {
      const type = randomItem(notificationTypes);
      const relatedSession = randomItem(sessions);
      notificationsPayload.push({
        user_id: user.id,
        type,
        title: `${type === 'session_reminder' ? 'Recordatorio' : 'Notificación'} - ${randomItem(subjects)}`,
        message: `Hola ${user.name.split(' ')[0]}, ${type === 'achievement_unlock' ? 'desbloqueaste un nuevo logro' : 'tienes novedades'} en la plataforma.`,
        is_read: Math.random() > 0.5,
        action_url: '/dashboard',
        metadata: {
          source: 'seed-script',
          importance: randomItem(['low', 'normal', 'high']),
        },
        related_group_id: relatedSession?.group_id || null,
        related_session_id: relatedSession?.id || null,
        expires_at: Math.random() > 0.7 ? new Date(Date.now() + randomInt(1, 10) * 86400000).toISOString() : null,
      });
    }
  });

  if (notificationsPayload.length) {
    await supabaseAdmin.from('notifications').insert(notificationsPayload);
  }
  console.log(`Notificaciones creadas: ${notificationsPayload.length}`);
}

async function createForums(users, groups) {
  console.log('\nCreando foros, publicaciones y respuestas...');
  const forumsPayload = [];

  for (let i = 0; i < FORUMS_TO_CREATE; i++) {
    const group = groups[i % groups.length];
    const creator = randomItem(users);
    forumsPayload.push({
      title: `${group.subject} - Debate ${i + 1}`,
      description: `Discusión abierta sobre ${group.subject}`,
      group_id: group.id,
      creator_id: creator.id,
      is_public: Math.random() > 0.3,
      allow_replies: true,
      require_approval: Math.random() > 0.8,
      status: randomItem(forumStatuses),
    });
  }

  const { data: forums, error } = await supabaseAdmin.from('forums').insert(forumsPayload).select();
  if (error) {
    throw new Error(`No se pudieron crear foros: ${error.message}`);
  }

  const postsPayload = [];
  const repliesPayload = [];
  const likesPayload = [];

  forums.forEach((forum) => {
    for (let i = 0; i < POSTS_PER_FORUM; i++) {
      const author = randomItem(users);
      postsPayload.push({
        forum_id: forum.id,
        author_id: author.id,
        title: `Tema ${i + 1}: ${randomItem(subjects)}`,
        content: `Contenido del tema ${i + 1} relacionado a ${forum.title}.`,
        is_pinned: i === 0 && Math.random() > 0.7,
        is_locked: Math.random() > 0.9,
        views: randomInt(10, 200),
        likes: randomInt(0, 40),
        replies_count: REPLIES_PER_POST,
      });
    }
  });

  const { data: posts, error: postError } = await supabaseAdmin.from('forum_posts').insert(postsPayload).select();
  if (postError) {
    throw new Error(`No se pudieron crear posts de foros: ${postError.message}`);
  }

  posts.forEach((post) => {
    const possibleAuthors = users.filter((user) => user.id !== post.author_id);
    for (let i = 0; i < REPLIES_PER_POST; i++) {
      const author = randomItem(possibleAuthors);
      repliesPayload.push({
        post_id: post.id,
        author_id: author.id,
        content: `Respuesta ${i + 1} al post ${post.title}.`,
        likes: randomInt(0, 20),
      });

      if (Math.random() > 0.6) {
        likesPayload.push({
          user_id: author.id,
          post_id: post.id,
          reply_id: null,
        });
      }
    }
  });

  if (repliesPayload.length) {
    const { data: replies, error: replyError } = await supabaseAdmin.from('forum_replies').insert(repliesPayload).select();
    if (replyError) {
      throw new Error(`No se pudieron crear respuestas de foros: ${replyError.message}`);
    }

    replies.forEach((reply) => {
      if (Math.random() > 0.5) {
        likesPayload.push({
          user_id: randomItem(users).id,
          post_id: null,
          reply_id: reply.id,
        });
      }
    });
  }

  if (likesPayload.length) {
    const uniqueLikes = likesPayload.filter(
      (like, index, self) =>
        index === self.findIndex((item) => item.user_id === like.user_id && item.post_id === like.post_id && item.reply_id === like.reply_id)
    );
    await supabaseAdmin.from('forum_likes').insert(uniqueLikes);
  }

  console.log(`Foros creados: ${forums.length}`);
  console.log(`Posts creados: ${posts.length}`);
  console.log(`Respuestas creadas: ${repliesPayload.length}`);
  console.log(`Likes registrados: ${likesPayload.length}`);
}

async function createMessages(groups, groupMembersMap) {
  console.log('\nCreando mensajes y lecturas...');
  const messagesPayload = [];

  groups.forEach((group) => {
    const members = groupMembersMap.get(group.id) || [];
    for (let i = 0; i < MESSAGES_PER_GROUP; i++) {
      const senderId = randomItem(members);
      messagesPayload.push({
        group_id: group.id,
        sender_id: senderId,
        content: `Mensaje ${i + 1} en ${group.name}: discusión de ${randomItem(subjects)}.`,
        status: randomItem(['sent', 'delivered', 'read']),
        is_edited: Math.random() > 0.85,
        created_at: new Date(Date.now() - randomInt(0, 10) * 3600000).toISOString(),
      });
    }
  });

  const { data: messages, error } = await supabaseAdmin.from('messages').insert(messagesPayload).select();
  if (error) {
    throw new Error(`No se pudieron crear mensajes: ${error.message}`);
  }

  const readsPayload = [];
  messages.forEach((message) => {
    const members = groupMembersMap.get(message.group_id) || [];
    members
      .filter((userId) => userId !== message.sender_id)
      .slice(0, randomInt(2, Math.min(5, members.length - 1)))
      .forEach((userId) => {
        readsPayload.push({
          message_id: message.id,
          user_id: userId,
          read_at: new Date(new Date(message.created_at).getTime() + randomInt(1, 120) * 60000).toISOString(),
        });
      });
  });

  if (readsPayload.length) {
    const uniqueReads = readsPayload.filter(
      (read, index, self) =>
        index === self.findIndex((item) => item.message_id === read.message_id && item.user_id === read.user_id)
    );
    await supabaseAdmin.from('message_reads').insert(uniqueReads);
  }

  console.log(`Mensajes creados: ${messages.length}`);
  console.log(`👀 Lecturas registradas: ${readsPayload.length}`);
}

async function createUserAchievements(users, achievements) {
  console.log('\nAsignando logros a usuarios...');
  const userAchievementsPayload = [];

  users.forEach((user) => {
    const earned = uniquePick(achievements, randomInt(3, 6));
    earned.forEach((achievement) => {
      userAchievementsPayload.push({
        user_id: user.id,
        achievement_id: achievement.id,
        unlocked_at: new Date(Date.now() - randomInt(0, 30) * 86400000).toISOString(),
        progress: {
          completed: Math.random() > 0.3,
          percentage: randomInt(40, 100),
        },
      });
    });
  });

  if (userAchievementsPayload.length) {
    await supabaseAdmin.from('user_achievements').insert(userAchievementsPayload);
  }
  console.log(`Relación usuario-logro creada: ${userAchievementsPayload.length}`);
}

async function createFiles(users, groups) {
  console.log('\n📂 Creando recursos y descargas...');
  const filesPayload = [];

  for (let i = 0; i < FILES_TO_CREATE; i++) {
    const uploader = randomItem(users);
    const group = randomItem(groups);
    filesPayload.push({
      name: `Recurso ${i + 1} - ${group.subject}`,
      original_name: `recurso_${slugify(group.subject)}_${i + 1}.pdf`,
      mime_type: 'application/pdf',
      size: randomInt(50000, 5000000),
      storage_path: `public/resources/${group.id}/${slugify(group.subject)}_${i + 1}.pdf`,
      uploaded_by: uploader.id,
      group_id: group.id,
      session_id: null,
      is_public: Math.random() > 0.5,
      is_deleted: false,
      resource_type: randomItem(resourceTypes),
      download_count: randomInt(0, 120),
    });
  }

  const { data: files, error } = await supabaseAdmin.from('files').insert(filesPayload).select();
  if (error) {
    console.warn(`⚠️ No se pudo crear la data de files: ${error.message}`);
    return;
  }

  const downloadsPayload = [];
  files.forEach((file) => {
    const downloaders = uniquePick(users, randomInt(2, 6));
    downloaders.forEach((user) => {
      downloadsPayload.push({
        file_id: file.id,
        user_id: user.id,
        downloaded_at: new Date(Date.now() - randomInt(0, 20) * 86400000).toISOString(),
      });
    });
  });

  if (downloadsPayload.length) {
    await supabaseAdmin.from('file_downloads').insert(downloadsPayload);
  }

  console.log(`📁 Recursos creados: ${files.length}`);
  console.log(`Descargas registradas: ${downloadsPayload.length}`);
}

async function main() {
  try {
    await deleteSeedAuthUsers();
    await resetTables();

    const users = await createUsers();
    const achievements = await createAchievements();
    const { groups, groupMembersMap } = await createGroupsAndMembers(users);
    const sessions = await createSessions(groups, groupMembersMap);
    await createNotifications(users, sessions);
    await createForums(users, groups);
    await createMessages(groups, groupMembersMap);
    await createUserAchievements(users, achievements);
    await createFiles(users, groups);

    console.log('\nSeed completo finalizado correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error ejecutando seed:', error.message);
    process.exit(1);
  }
}

main();
