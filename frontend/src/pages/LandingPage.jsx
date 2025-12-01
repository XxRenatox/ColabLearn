import React from "react";
import { useNavigate } from "react-router-dom";
import CTASection from "../components/landing/CTASection";
import HowItWorksSection from "../components/landing/GettingStartedSection";
import Hero from "../components/landing/Hero";
import StatsSection from "../components/landing/StatsSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import Footer from "../components/layout/Footer";
import { useUser } from "../hooks/useUser";
import { useAuth } from "../contexts/AuthContext";

const testimonial = [
  {
    name: "Ana Gómez",
    role: "Estudiante de Secundaria",
    content:
      "ColabLearn transformó mi forma de estudiar. Mis calificaciones mejoraron y ahora disfruto aprendiendo.",
    rating: 5,
    delay: 0,
  },
  {
    name: "Carlos Pérez",
    role: "Universitario",
    content:
      "Gracias a ColabLearn encontré compañeros con intereses similares. Ahora estudiar en grupo es mucho más productivo.",
    rating: 4,
    delay: 100,
  },
  {
    name: "Laura Torres",
    role: "Profesora",
    content:
      "Como docente, ColabLearn me ha permitido recomendar recursos efectivos y ver a mis estudiantes motivados.",
    rating: 5,
    delay: 200,
  },
];

// Componente principal
function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  const { isAuthenticated: authIsAuthenticated } = useAuth();

  // No redirigir automáticamente - permitir que los usuarios visiten la landing page
  // incluso si están autenticados

  // Función para manejar la navegación
  const handleAuthAction = () => {
    if (isAuthenticated || authIsAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen">
      <Hero isAuthenticated={isAuthenticated} onAuthAction={handleAuthAction} />

      <StatsSection />

      {/* How It Works - Sección principal interactiva */}
      <HowItWorksSection />

      {/* Testimonials Section */}
      <TestimonialsSection testimonial={testimonial} />

      {/* CTA Final */}
      <CTASection
        isAuthenticated={isAuthenticated}
        onAuthAction={handleAuthAction}
      />

      <Footer />
    </div>
  );
}

export default Landing;
