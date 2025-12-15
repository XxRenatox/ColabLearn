import { useState, useEffect } from "react";
import { Users, MessageCircle, Trophy, Sparkles } from "lucide-react";
import { StatsCard } from "../ui/cards/common/StatsCard";

const StatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({
    students: 0,
    groups: 0,
    success: 0,
  });

  const finalStats = {
    students: 52847,
    groups: 8943,
    success: 96,
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          Object.keys(finalStats).forEach((key) => {
            let start = 0;
            const end = finalStats[key];
            const duration = 2000;
            const increment = end / (duration / 16);

            const timer = setInterval(() => {
              start += increment;
              if (start >= end) {
                start = end;
                clearInterval(timer);
              }
              setStats((prev) => ({ ...prev, [key]: Math.floor(start) }));
            }, 16);
          });
        }
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById("stats");
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="stats"
      className="py-24 bg-gradient-to-t to-gray-900 to-75% from-indigo-900 text-white relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-400 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-20 w-64 h-64 bg-purple-400 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
            Impacto Global
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Una Comunidad Global que Crece
          </h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Miles de estudiantes de todo el mundo ya están transformando su
            experiencia de aprendizaje
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <StatsCard
            icon={Users}
            value={`${stats.students.toLocaleString()}+`}
            label="Estudiantes Activos"
            iconGradient="from-yellow-400 to-orange-400"
            delay={0}
            isVisible={isVisible}
          />
          <StatsCard
            icon={MessageCircle}
            value={`${stats.groups.toLocaleString()}+`}
            label="Grupos de Estudio"
            iconGradient="from-green-400 to-emerald-400"
            delay={200}
            isVisible={isVisible}
          />
          <StatsCard
            icon={Trophy}
            value={`${stats.success}%`}
            label="Mejora en Calificaciones"
            iconGradient="from-purple-400 to-pink-400"
            delay={400}
            isVisible={isVisible}
          />
        </div>
      </div>
    </section>
  );
};

export default StatsSection;