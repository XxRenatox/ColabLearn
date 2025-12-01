import React, { useMemo } from "react";
import { Clock, Calendar, Trophy, Sparkles, Flame, Target } from "lucide-react";
import { ProgressBar, LevelProgressBar } from "../../../ui/ProgressBar";
import ActiveSessionSection from "../sessions/ActiveSessionSection";
import { MetricCard } from "../../../ui/cards/common/MetricCard";
import { ProgressCard } from "../../../ui/cards/common/ProgressCard";
import { ActivityCard } from "../../../ui/cards/common/ActivityCard";
import { WelcomeCard } from "../../../ui/cards/common/WelcomeCard";
import { AchievementProgressCard } from "../../../ui/cards/achievements/AchievementProgressCard";

function Dashboard({
  user,
  sessions = [],
  groups = [],
  achievements = [],
  upcomingSessions = [],
  recentActivity = [],
  loading = {},
  activeSession,
  onLeaveSession,
}) {
  const name = user?.name?.split(" ")[0] || "estudiante";
  const totalHours = user?.study_hours || 0;
  const streak = user?.streak || 0;

  // ==== Cálculos semanales optimizados ====
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const completedThisWeek = sessions.filter(
    (s) => s.status === "completed" && new Date(s.scheduled_date) >= startOfWeek
  ).length;

  const weeklyHours = completedThisWeek * 2;
  const dailyAverage = weeklyHours / 7;
  const weeklyProgress = Math.min((weeklyHours / 20) * 100, 100);

  // ==== Logros ====
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const totalAchievements = achievements.length;
  const achievementProgress = totalAchievements
    ? (unlocked / totalAchievements) * 100
    : 0;

  // ==== Sesiones de hoy ====
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const todaySessions = upcomingSessions.filter((s) => {
    const d = new Date(s.scheduled_date);
    return d >= today && d < tomorrow;
  }).length;

  // ==== Formateadores ====
  const formatDate = (value) => {
    if (!value) return "Sin fecha";
    const d = new Date(value);
    return d.toLocaleString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading.user || loading.sessions || loading.groups) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* === Sesión activa === */}
      {activeSession && (
        <ActiveSessionSection
          session={activeSession}
          user={user}
          onLeaveSession={onLeaveSession}
        />
      )}

      {/* === Cabecera === */}
      <WelcomeCard
        name={`Hola, ${name}`}
        message={
          todaySessions > 0
            ? `Tienes ${todaySessions} sesión${
                todaySessions > 1 ? "es" : ""
              } programada${todaySessions > 1 ? "s" : ""} para hoy.`
            : "No tienes sesiones programadas hoy. Planifica una y sigue progresando."
        }
        badges={[
          {
            icon: Calendar,
            text: upcomingSessions.length
              ? `${upcomingSessions.length} próxim${upcomingSessions.length === 1 ? "a" : "as"}`
              : "Agenda libre"
          },
          {
            icon: Flame,
            text: `Racha ${streak} días`
          },
          {
            icon: Clock,
            text: `${totalHours} h acumuladas`
          }
        ]}
      />

      {/* === Métricas rápidas === */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            title: "Horas esta semana",
            value: `${weeklyHours.toFixed(1)} h`,
            helper: "Meta 20 h",
            icon: Clock,
            accent: "from-sky-500 to-indigo-500",
            iconStyles: "bg-sky-100 text-sky-600",
            valueColor: "text-sky-700",
          },
          {
            title: "Promedio diario",
            value: `${dailyAverage.toFixed(1)} h`,
            helper: "Basado en últimos 7 días",
            icon: Target,
            accent: "from-emerald-500 to-teal-500",
            iconStyles: "bg-emerald-100 text-emerald-600",
            valueColor: "text-emerald-700",
          },
          {
            title: "Grupos activos",
            value: groups.length,
            helper: "Comunidades donde participas",
            icon: Calendar,
            accent: "from-purple-500 to-fuchsia-500",
            iconStyles: "bg-purple-100 text-purple-600",
            valueColor: "text-purple-700",
          },
          {
            title: "Racha de estudio",
            value: `${streak} días`,
            helper: "Mantén tu ritmo",
            icon: Flame,
            accent: "from-orange-500 to-rose-500",
            iconStyles: "bg-orange-100 text-orange-600",
            valueColor: "text-orange-700",
          },
        ].map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            helper={metric.helper}
            icon={metric.icon}
            accent={metric.accent}
            iconStyles={metric.iconStyles}
            valueColor={metric.valueColor}
          />
        ))}
      </section>

      {/* === Sección principal dividida === */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === Progreso semanal === */}
        <ProgressCard
          title="Progreso semanal"
          progress={weeklyProgress}
          description={
            weeklyProgress >= 100
              ? "¡Excelente! Has superado tu meta semanal."
              : weeklyProgress >= 75
              ? "Muy bien, estás cerca del objetivo."
              : weeklyProgress >= 50
              ? "Buen progreso, continúa así."
              : "Aún tienes tiempo para alcanzar tu meta semanal."
          }
          badge={
            <span className="inline-flex items-center gap-2">
              <Target className="h-4 w-4" />
              {weeklyProgress.toFixed(0)}%
            </span>
          }
          borderColor="border-indigo-100"
          gradientFrom="from-indigo-50"
          gradientVia="via-white"
          gradientTo="to-emerald-50"
        />

        {/* === Logros === */}
        <AchievementProgressCard
          progress={achievementProgress}
          unlocked={unlocked}
          total={totalAchievements}
        />
      </section>

      {/* === Agenda y actividad === */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActivityCard
          title="Próximas sesiones"
          items={upcomingSessions.slice(0, 6)}
          emptyMessage="No tienes sesiones próximas. Crea una para mantener la constancia."
          formatDate={formatDate}
          borderColor="border-sky-100"
          gradientFrom="from-indigo-50"
          gradientVia="via-white"
          gradientTo="to-sky-50"
        />

        <ActivityCard
          title="Actividad reciente"
          items={recentActivity.slice(0, 8)}
          emptyMessage="Aún no registramos actividad reciente."
          formatDate={formatDate}
          borderColor="border-rose-100"
          gradientFrom="from-rose-50"
          gradientVia="via-white"
          gradientTo="to-amber-50"
        />
      </section>
    </div>
  );
}

export default Dashboard;
