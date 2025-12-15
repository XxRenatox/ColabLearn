import React from "react";
import { Button } from "./ui/Components";
import { ArrowRight, Check, Shield, Rocket } from "lucide-react";

const CTASection = ({ isAuthenticated, onAuthAction }) => {
  return (
    <section className="py-24 bg-gradient-to-br from-indigo-900 via-indigo-900 to-black text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-20 w-64 h-64 bg-cyan-500 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-32 h-32 bg-indigo-500 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="mb-8">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            ¿Listo para revolucionar tu forma de
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              {" "}
              estudiar?
            </span>
          </h2>
          <p className="text-2xl mb-8 opacity-90 leading-relaxed max-w-4xl mx-auto">
            Únete a más de{" "}
            <strong className="text-cyan-400">52,000 estudiantes</strong> que ya
            están alcanzando sus metas académicas más ambiciosas con ColabLearn.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
          <Button
            onClick={onAuthAction}
            variant="outline"
            size="lg"
            className="text-xl px-16 py-6 flex items-center justify-center space-x-3 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-purple-500 hover:border-transparent"
          >
            <Rocket className="w-5 h-5" />
            <span>{isAuthenticated ? "Ir al Dashboard" : "Crear Cuenta Gratis"}</span>
            <ArrowRight className="w-6 h-6" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm opacity-75 mb-8">
          <div className="flex items-center justify-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2">
            <Check className="w-4 h-4 text-green-400" />
            <span>Sin compromiso</span>
          </div>
          <div className="flex items-center justify-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2">
            <Check className="w-4 h-4 text-green-400" />
            <span>Cancela cuando quieras</span>
          </div>
          <div className="flex items-center justify-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span>Soporte 24/7</span>
          </div>
        </div>
      </div>
    </section>
  );
};
export default CTASection;