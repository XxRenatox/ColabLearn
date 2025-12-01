import { Star } from "lucide-react";
import Avatar from "../../ui/Avatar";
import { LandingCard } from "../../ui/cards/landing/LandingCard";

// Componente Button mejorado
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  fullWidth = false,
  ...props
}) => {
  const baseClasses = `font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
    fullWidth ? "w-full" : ""
  }`;
  const variants = {
    primary:
      "bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-purple-500/25 bg-size-200 hover:bg-right",
    secondary:
      "bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50 hover:shadow-xl",
    outline:
      "border-2 border-white text-white hover:bg-white hover:text-purple-600 backdrop-blur-sm",
    ghost: "text-gray-700 hover:text-purple-600 hover:bg-purple-50",
    gradient:
      "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400",
  };
  const sizes = {
    xs: "px-4 py-2 text-xs",
    sm: "px-6 py-2.5 text-sm",
    md: "px-8 py-3 text-base",
    lg: "px-10 py-4 text-lg xl:px-12 xl:py-5 xl:text-xl",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ backgroundSize: "200% 100%" }}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
    </button>
  );
};

// Componente Feature mejorado
export const Feature = ({ icon: Icon, title, description, delay = 0 }) => {
  return (
    <LandingCard delay={delay}>
      <div className="text-center">
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
          <Icon className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-cyan-500 transition-all duration-300">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
          {description}
        </p>
      </div>
    </LandingCard>
  );
};

// Componente Testimonial mejorado
export const Testimonial = ({ name, role, content, rating = 5, delay = 0 }) => {
  return (
    <LandingCard delay={delay}>
      <div className="flex items-center mb-6">
        {[...Array(rating)].map((_, i) => (
          <Star
            key={i}
            className="w-6 h-6 text-yellow-400 fill-current transform transition-transform duration-200 hover:scale-125"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
      <p className="text-gray-600 mb-6 italic text-lg leading-relaxed">
        "{content}"
      </p>
      <div className="flex items-center space-x-4">
        <Avatar
          userId={name.toLowerCase().replace(/\s+/g, '-') || 'testimonial'}
          name={name || "Usuario"}
          avatar={null}
          size="lg"
          showBorder={false}
        />
        <div>
          <p className="font-semibold text-gray-800 text-lg">{name}</p>
          <p className="text-gray-500">{role}</p>
        </div>
      </div>
    </LandingCard>
  );
};
