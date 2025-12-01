import { GraduationCap, Bell } from "lucide-react";

export const Navbar = () => {
  return (
    <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo y nombre */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xl font-semibold tracking-tight">ColabLearn</span>
          </div>
          {/* Menú y notificaciones */}
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-purple-200 transition-colors font-medium">Dashboard</a>
            <a href="#" className="hover:text-purple-200 transition-colors font-medium">Grupos</a>
            <button className="relative focus:outline-none">
              <Bell className="w-6 h-6 hover:text-purple-200 transition-colors" />
              {/* Notificación */}
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full px-1.5 py-0.5">3</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};