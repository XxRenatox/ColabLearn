-- =========================================================
-- ColabLearn - Schema Unificado (Supabase / PostgreSQL)
-- =========================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Seguridad base
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Asegurar que los roles principales tengan acceso al esquema público
GRANT USAGE ON SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT CREATE ON SCHEMA public TO postgres, service_role;

-- Permisos para tablas y secuencias existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated, anon;

-- Mantener permisos para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role, authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role, authenticated, anon;

-- =========================
-- ENUMS
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student', 'tutor', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_member_role') THEN
    CREATE TYPE group_member_role AS ENUM ('admin', 'moderator', 'member');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_type') THEN
    CREATE TYPE session_type AS ENUM ('study', 'review', 'exam_prep', 'project', 'discussion', 'tutoring');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
    CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
    CREATE TYPE attendance_status AS ENUM ('confirmed', 'maybe', 'declined', 'no_response');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM ('session', 'exam', 'assignment', 'reminder', 'deadline');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('group_invite', 'session_reminder', 'achievement_unlock', 'system');
  END IF;
END $$;

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar TEXT DEFAULT '👤',
    university VARCHAR(150) NOT NULL DEFAULT '',
    career VARCHAR(150) NOT NULL DEFAULT '',
    semester VARCHAR(20) NOT NULL DEFAULT '',
    role user_role DEFAULT 'student',

    -- Gamification
    level INTEGER DEFAULT 1 CHECK (level > 0),
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    streak INTEGER DEFAULT 0 CHECK (streak >= 0),
    study_hours DECIMAL(10,2) DEFAULT 0 CHECK (study_hours >= 0),

    -- Preferencias
    preferences JSONB DEFAULT '{}',

    -- Stats
    total_sessions INTEGER DEFAULT 0,
    total_groups INTEGER DEFAULT 0,
    help_given INTEGER DEFAULT 0,
    help_received INTEGER DEFAULT 0,

    -- Estado de cuenta
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    last_active TIMESTAMP DEFAULT NOW(),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT users_email_lowercase CHECK (email = LOWER(email))
);

-- =========================
-- GROUPS
-- =========================
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    university VARCHAR(150) NOT NULL,
    career VARCHAR(150) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    color VARCHAR(50) DEFAULT 'bg-blue-500',
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Settings
    max_members INTEGER DEFAULT 20 CHECK (max_members BETWEEN 2 AND 100),
    is_private BOOLEAN DEFAULT FALSE,
    invite_code VARCHAR(10) UNIQUE,
    allow_invites BOOLEAN DEFAULT TRUE,
    require_approval BOOLEAN DEFAULT FALSE,

    -- Stats
    total_sessions INTEGER DEFAULT 0,
    total_hours DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating BETWEEN 0 AND 5),
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'pending')),
    last_activity TIMESTAMP DEFAULT NOW(),

    -- Optional academic timeline
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    total_weeks INTEGER,
    current_week INTEGER,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- GROUP MEMBERS
-- =========================
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role group_member_role DEFAULT 'member',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned', 'pending')),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- =========================
-- SESSIONS
-- =========================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type session_type DEFAULT 'study',

    -- Scheduling
    scheduled_date TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL CHECK (duration BETWEEN 15 AND 480), -- minutes
    timezone VARCHAR(50) DEFAULT 'America/Santiago',

    -- Location
    location_type VARCHAR(20) DEFAULT 'virtual' CHECK (location_type IN ('virtual', 'physical')),
    location_details TEXT NOT NULL,
    location_room VARCHAR(100),
    platform VARCHAR(50),

    -- Settings
    max_attendees INTEGER DEFAULT 20 CHECK (max_attendees BETWEEN 2 AND 100),

    -- Status and timing
    status session_status DEFAULT 'scheduled',
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,

    -- Resources and notes
    agenda JSONB DEFAULT '[]',
    resources JSONB DEFAULT '[]',
    session_notes JSONB DEFAULT '{}',
    recording_url TEXT,

    -- Recurring
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,
    parent_session_id UUID REFERENCES sessions(id),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- SESSION ATTENDANCE / FEEDBACK
-- =========================
CREATE TABLE session_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status attendance_status DEFAULT 'no_response',
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    actual_duration INTEGER,
    response_date TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

CREATE TABLE session_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- =========================
-- CALENDAR EVENTS
-- =========================
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type event_type NOT NULL,

    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(50) DEFAULT 'America/Santiago',

    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,

    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    color VARCHAR(50) DEFAULT 'bg-blue-500',
    location TEXT,

    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule JSONB,
    parent_event_id UUID REFERENCES calendar_events(id),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- ACHIEVEMENTS
-- =========================
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT 'trophy',
    category VARCHAR(50) NOT NULL,
    requirements JSONB NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    progress JSONB DEFAULT '{}',
    UNIQUE(user_id, achievement_id)
);

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',

    related_user_id UUID REFERENCES users(id),
    related_group_id UUID REFERENCES groups(id),
    related_session_id UUID REFERENCES sessions(id),

    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- FILES / RESOURCES
-- =========================
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,

    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,

    -- NUEVO: campos usados por policies
    is_public BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- NUEVO: tipo de recurso
    resource_type VARCHAR(50) DEFAULT 'document'
      CHECK (resource_type IN ('guide','document','link','exercise','material_theory','video','tool','other')),

    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE file_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- FORUMS
-- =========================
CREATE TABLE forums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    is_public BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT FALSE,
    allow_replies BOOLEAN DEFAULT TRUE,
    require_approval BOOLEAN DEFAULT FALSE,

    total_posts INTEGER DEFAULT 0,
    total_replies INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT NOW(),

    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','archived','deleted')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,

    title VARCHAR(300),
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,

    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,

    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,

    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE forum_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (
      (post_id IS NOT NULL AND reply_id IS NULL) OR
      (post_id IS NULL AND reply_id IS NOT NULL)
    ),
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, reply_id)
);

-- =========================
-- GROUP CHAT (MESSAGES)
-- =========================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent','delivered','read')),
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quién leyó qué mensaje
CREATE TABLE message_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- =========================
-- ÍNDICES
-- =========================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_univ_career ON users(university, career);
CREATE INDEX idx_users_last_active ON users(last_active);

CREATE INDEX idx_groups_creator ON groups(creator_id);
CREATE INDEX idx_groups_univ_career ON groups(university, career, subject);
CREATE INDEX idx_groups_invite ON groups(invite_code);
CREATE INDEX idx_groups_status ON groups(status, last_activity);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_status ON group_members(status);

CREATE INDEX idx_sessions_group ON sessions(group_id);
CREATE INDEX idx_sessions_organizer ON sessions(organizer_id);
CREATE INDEX idx_sessions_date ON sessions(scheduled_date);
CREATE INDEX idx_sessions_status ON sessions(status);

CREATE INDEX idx_attendance_session ON session_attendance(session_id);
CREATE INDEX idx_attendance_user ON session_attendance(user_id);

CREATE INDEX idx_calendar_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_date ON calendar_events(start_date, end_date);
CREATE INDEX idx_calendar_type ON calendar_events(event_type);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

CREATE INDEX idx_files_uploader ON files(uploaded_by);
CREATE INDEX idx_files_group ON files(group_id);
CREATE INDEX idx_files_public ON files(is_public);
CREATE INDEX idx_files_deleted ON files(is_deleted);
CREATE INDEX idx_file_downloads_file ON file_downloads(file_id);
CREATE INDEX idx_file_downloads_user ON file_downloads(user_id);

CREATE INDEX idx_forums_group ON forums(group_id);
CREATE INDEX idx_forums_creator ON forums(creator_id);
CREATE INDEX idx_forums_status ON forums(status);
CREATE INDEX idx_forums_last_activity ON forums(last_activity);

CREATE INDEX idx_posts_forum ON forum_posts(forum_id);
CREATE INDEX idx_posts_author ON forum_posts(author_id);
CREATE INDEX idx_posts_parent ON forum_posts(parent_post_id);
CREATE INDEX idx_posts_created ON forum_posts(created_at);
CREATE INDEX idx_posts_pinned ON forum_posts(is_pinned);

CREATE INDEX idx_replies_post ON forum_replies(post_id);
CREATE INDEX idx_replies_author ON forum_replies(author_id);
CREATE INDEX idx_replies_parent ON forum_replies(parent_reply_id);

CREATE INDEX idx_likes_user ON forum_likes(user_id);
CREATE INDEX idx_likes_post ON forum_likes(post_id);
CREATE INDEX idx_likes_reply ON forum_likes(reply_id);

CREATE INDEX idx_messages_group ON messages(group_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_message_reads_msg ON message_reads(message_id);
CREATE INDEX idx_message_reads_user ON message_reads(user_id);

CREATE INDEX idx_message_reads_read_at ON message_reads(read_at);

-- =========================
-- FUNCTIONS / TRIGGERS
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- updated_at triggers
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_groups_updated BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_calendar_updated BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_forums_updated BEFORE UPDATE ON forums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_replies_updated BEFORE UPDATE ON forum_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_messages_updated BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Invite code generator
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_groups_invite BEFORE INSERT ON groups FOR EACH ROW EXECUTE FUNCTION generate_invite_code();

-- Contadores de foros
CREATE OR REPLACE FUNCTION update_forum_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forums SET total_posts = total_posts + 1, last_activity = NOW()
    WHERE id = NEW.forum_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forums SET total_posts = GREATEST(0, total_posts - 1)
    WHERE id = OLD.forum_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_forum_post_count
AFTER INSERT OR DELETE ON forum_posts
FOR EACH ROW EXECUTE FUNCTION update_forum_post_count();

CREATE OR REPLACE FUNCTION update_post_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET replies_count = replies_count + 1
    WHERE id = NEW.post_id;

    UPDATE forums SET total_replies = total_replies + 1, last_activity = NOW()
    WHERE id = (SELECT forum_id FROM forum_posts WHERE id = NEW.post_id);

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET replies_count = GREATEST(0, replies_count - 1)
    WHERE id = OLD.post_id;

    UPDATE forums SET total_replies = GREATEST(0, total_replies - 1)
    WHERE id = (SELECT forum_id FROM forum_posts WHERE id = OLD.post_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_replies_count
AFTER INSERT OR DELETE ON forum_replies
FOR EACH ROW EXECUTE FUNCTION update_post_replies_count();

-- =========================
-- RLS
-- =========================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Service role full access users" ON users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Groups
CREATE POLICY "View groups as member" ON groups FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = groups.id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
  )
);
CREATE POLICY "View public groups" ON groups FOR SELECT USING (is_private = FALSE);
CREATE POLICY "Create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Admins update groups" ON groups FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
      AND gm.role = 'admin' AND gm.status = 'active'
  )
);
CREATE POLICY "Admins delete groups" ON groups FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
      AND gm.role = 'admin' AND gm.status = 'active'
  )
);
CREATE POLICY "Service role full access groups" ON groups
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Group members
CREATE POLICY "View own membership" ON group_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all members" ON group_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
      AND gm.role = 'admin' AND gm.status = 'active'
  )
);
CREATE POLICY "Join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own membership" ON group_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins update memberships" ON group_members FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
      AND gm.role = 'admin' AND gm.status = 'active'
  )
);
CREATE POLICY "Service role full access group_members" ON group_members
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Sessions
CREATE POLICY "View sessions as member" ON sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = sessions.group_id AND gm.user_id = auth.uid()
      AND gm.status = 'active'
  )
);
CREATE POLICY "Create sessions (admins/mods)" ON sessions FOR INSERT WITH CHECK (
  auth.uid() = organizer_id AND EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = sessions.group_id AND gm.user_id = auth.uid()
      AND gm.role IN ('admin','moderator') AND gm.status = 'active'
  )
);
CREATE POLICY "Update own sessions" ON sessions FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Delete own sessions" ON sessions FOR DELETE USING (auth.uid() = organizer_id);
CREATE POLICY "Service role full access sessions" ON sessions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Attendance
CREATE POLICY "View attendance for accessible sessions" ON session_attendance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN group_members gm ON gm.group_id = s.group_id
    WHERE session_attendance.session_id = s.id
      AND gm.user_id = auth.uid() AND gm.status = 'active'
  )
);
CREATE POLICY "Manage own attendance" ON session_attendance FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access session_attendance" ON session_attendance
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Feedback
CREATE POLICY "View feedback for accessible sessions" ON session_feedback FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN group_members gm ON gm.group_id = s.group_id
    WHERE session_feedback.session_id = s.id
      AND gm.user_id = auth.uid() AND gm.status = 'active'
  )
);
CREATE POLICY "Insert own feedback" ON session_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own feedback" ON session_feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access session_feedback" ON session_feedback
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Calendar events
CREATE POLICY "View own or group events" ON calendar_events FOR SELECT USING (
  auth.uid() = user_id OR (
    group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = calendar_events.group_id
        AND gm.user_id = auth.uid() AND gm.status = 'active'
    )
  )
);
CREATE POLICY "Insert own events" ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own events" ON calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own events" ON calendar_events FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access calendar_events" ON calendar_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Achievements
CREATE POLICY "View achievements" ON achievements FOR SELECT USING (TRUE);
CREATE POLICY "System inserts achievements" ON achievements FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Service role full access achievements" ON achievements
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "View own user_achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own user_achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access user_achievements" ON user_achievements
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Notifications
CREATE POLICY "View own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System insert notifications" ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Service role full access notifications" ON notifications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Files
CREATE POLICY "View public files (not deleted)" ON files FOR SELECT USING (is_public = TRUE AND is_deleted = FALSE);
CREATE POLICY "View files of own groups" ON files FOR SELECT USING (
  is_deleted = FALSE AND group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = files.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
  )
);
CREATE POLICY "View own uploaded files" ON files FOR SELECT USING (uploaded_by = auth.uid());
CREATE POLICY "Upload files" ON files FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Update own files" ON files FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Delete own files" ON files FOR DELETE USING (auth.uid() = uploaded_by);
CREATE POLICY "Service role full access files" ON files
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- File downloads
CREATE POLICY "View own downloads" ON file_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own downloads" ON file_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access file_downloads" ON file_downloads
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Forums
CREATE POLICY "View public forums" ON forums FOR SELECT USING (is_public = TRUE AND status = 'active');
CREATE POLICY "View group forums" ON forums FOR SELECT USING (
  group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = forums.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
  )
);
CREATE POLICY "Create forums" ON forums FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Update own forums" ON forums FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Delete own forums" ON forums FOR DELETE USING (auth.uid() = creator_id);
CREATE POLICY "Service role full access forums" ON forums
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Forum posts
CREATE POLICY "View posts in accessible forums" ON forum_posts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM forums f
    WHERE f.id = forum_posts.forum_id
      AND (f.is_public = TRUE OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = f.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
      ))
      AND f.status = 'active'
  ) AND is_deleted = FALSE
);
CREATE POLICY "Create posts" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Update own posts" ON forum_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Service role full access forum_posts" ON forum_posts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Forum replies
CREATE POLICY "View replies to accessible posts" ON forum_replies FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM forum_posts p
    JOIN forums f ON f.id = p.forum_id
    WHERE p.id = forum_replies.post_id
      AND (f.is_public = TRUE OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = f.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
      ))
      AND f.status = 'active'
  ) AND is_deleted = FALSE
);
CREATE POLICY "Create replies" ON forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Update own replies" ON forum_replies FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Service role full access forum_replies" ON forum_replies
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Forum likes
CREATE POLICY "View likes" ON forum_likes FOR SELECT USING (TRUE);
CREATE POLICY "Create own likes" ON forum_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own likes" ON forum_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access forum_likes" ON forum_likes
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Messages
CREATE POLICY "View group messages" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
  )
);
CREATE POLICY "Send group messages" ON messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
  ) AND sender_id = auth.uid()
);
CREATE POLICY "Edit own messages (server may enforce time limit)" ON messages FOR UPDATE USING (sender_id = auth.uid());
CREATE POLICY "Delete own messages or admins" ON messages FOR DELETE USING (
  sender_id = auth.uid() OR EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin','moderator') AND gm.status = 'active'
  )
);
CREATE POLICY "Service role full access messages" ON messages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Message reads
CREATE POLICY "View reads for accessible messages" ON message_reads FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN group_members gm ON gm.group_id = m.group_id
    WHERE m.id = message_reads.message_id
      AND gm.user_id = auth.uid() AND gm.status = 'active'
  )
);
CREATE POLICY "Insert own read receipts" ON message_reads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access message_reads" ON message_reads
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');