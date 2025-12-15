import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { AchievementProvider } from './contexts/AchievementContext';
import { ToastProvider, ToastContainer } from './components/ui/Toast';
import FriendlyErrorBoundary from './components/ui/FriendlyErrorBoundary';
import Landing from './pages/LandingPage';
import ColabLearnAuth from './pages/LoginPage';
import ColabLearnUserPanel from './pages/UserPanelPage';
import MatchingPreferences from './pages/PreferencesPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminDashboard from './pages/admin/AdminDashboard';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CookiesPage from './pages/CookiesPage';
import SecurityPage from './pages/SecurityPage';


// Componente principal de la aplicación
function AppContent() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<ColabLearnAuth />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <ColabLearnUserPanel />
          </ProtectedRoute>
        } />
        <Route path="/preferences" element={
          <ProtectedRoute>
            <MatchingPreferences />
          </ProtectedRoute>
        } />

        {/* Rutas adicionales que se pueden implementar */}
        <Route path="/groups" element={
          <ProtectedRoute>
            <ColabLearnUserPanel />
          </ProtectedRoute>
        } />
        <Route path="/sessions" element={
          <ProtectedRoute>
            <ColabLearnUserPanel />
          </ProtectedRoute>
        } />
        <Route path="/sessions/:id" element={
          <ProtectedRoute>
            <ColabLearnUserPanel />
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <ColabLearnUserPanel />
          </ProtectedRoute>
        } />
        <Route path="/achievements" element={
          <ProtectedRoute>
            <ColabLearnUserPanel />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <ColabLearnUserPanel />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ColabLearnUserPanel />
          </ProtectedRoute>
        } />


        {/* Páginas públicas legales y de información */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/security" element={<SecurityPage />} />

        {/* Ruta catch-all para 404 */}
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-gray-600">Página no encontrada</p>
            </div>
          </div>
        } />
      </Routes>

      {/* Contenedor de toasts */}
      <ToastContainer />
    </>
  );
}

// Componente interno que usa los hooks dentro de los providers
const AppProvidersContent = ({ children }) => {
  const authContext = useAuth();
  const appContext = useApp();

  const currentUser = authContext?.currentUser || null;
  const isAuthenticated = authContext?.isAuthenticated || false;
  const loading = authContext?.loading || false;

  // AppContext tiene user directamente y también en state.user
  const appUser = appContext?.user || appContext?.state?.user || null;
  const appIsAuthenticated = appContext?.isAuthenticated || false;
  const appLoading = appContext?.loading || {};

  const effectiveUser = currentUser || appUser || null;
  const effectiveAuthenticated = Boolean(isAuthenticated || appIsAuthenticated);
  const isLoading = loading || (appLoading?.user ?? false);

  const content = (
    <AchievementProvider>
      {children}
    </AchievementProvider>
  );

  if (isLoading) {
    return content;
  }

  if (!effectiveAuthenticated || !effectiveUser) {
    return content;
  }

  return (
    <SocketProvider>
      {content}
    </SocketProvider>
  );
};

// Wrapper que no usa hooks directamente
const AppProviders = ({ children }) => {
  return <AppProvidersContent>{children}</AppProvidersContent>;
};

const App = () => (
  <FriendlyErrorBoundary>
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <AppProviders>
              <AppContent />
            </AppProviders>
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  </FriendlyErrorBoundary>
);

export default App;
