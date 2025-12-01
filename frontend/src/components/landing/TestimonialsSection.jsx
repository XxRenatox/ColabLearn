import { Star } from "lucide-react";
import { Testimonial } from "../landing/ui/Components";

const TestimonialsSection = ({ testimonial }) => {
  return (
    <section
      id="testimonials"
      className="py-24 bg-gradient-to-tr from-indigo-900 via-indigo-900 to-emerald-700 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-cyan-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full px-6 py-2 text-orange-700 font-medium mb-6">
            <Star className="w-5 h-5 mr-2" />
            Testimonios Reales
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Historias de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-500">
              Éxito
            </span>{" "}
            que Inspiran
          </h2>
          <p className="text-xl text-white max-w-3xl mx-auto">
            Descubre cómo estudiantes como tú han transformado sus
            calificaciones y su vida académica
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {testimonial.map((testimonial, index) => (
            <Testimonial
              key={index}
              name={testimonial.name}
              role={testimonial.role}
              content={testimonial.content}
              rating={testimonial.rating}
              delay={testimonial.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
