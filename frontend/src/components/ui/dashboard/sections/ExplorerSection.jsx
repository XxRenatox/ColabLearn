import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Search,
  Filter,
  Users,
  Sparkles,
  Target,
  Key,
  AlertCircle,
  CheckCircle,
  Copy,
  Check,
  TrendingUp,
  RefreshCw,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { ExplorerGroupCard } from "../../../ui/Card";
import { useGroups } from "../../../../hooks/useGroups";
import { useToast } from "../../../ui/Toast";
import { useMatching } from "../../../../hooks/useMatching";
import { groupsAPI } from "../../../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { GroupDetailModal } from "../../../modals/groups/GroupDetailModal";
import { useNavigate } from "react-router-dom";

const ExplorerSection = ({ user, groups = [] }) => {
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [searchedGroup, setSearchedGroup] = useState(null);
  const [loadingInviteCode, setLoadingInviteCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [filters, setFilters] = useState({
    university: "",
    career: "",
    semester: "",
    subject: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const { addToast } = useToast();
  const {
    groupRecommendations,
    loading: matchingLoading,
    error: matchingError,
    fetchGroupRecommendations,
  } = useMatching();

  const { searchGroups, joinGroup } = useGroups();
  const navigate = useNavigate();

  // Estados para datos dinámicos
  const [publicGroups, setPublicGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);

  // Ref para evitar llamadas duplicadas
  const fetchingRef = useRef(false);
  const searchTimeoutRef = useRef(null);
  const lastSearchParamsRef = useRef("");

  // Serializar filtros para comparación
  const filtersKey = useMemo(() => {
    return JSON.stringify({
      university: filters.university || "",
      career: filters.career || "",
      semester: filters.semester || "",
      subject: filters.subject || "",
      query: debouncedSearchQuery || "",
    });
  }, [filters.university, filters.career, filters.semester, filters.subject, debouncedSearchQuery]);

  // Debounce para el input de búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Cargar recomendaciones de grupos al montar
  useEffect(() => {
    if (user && activeTab === "discover") {
      fetchGroupRecommendations();
    }
  }, [user, activeTab, fetchGroupRecommendations]);

  // Función para buscar grupos públicos con filtros (memoizada)
  const fetchPublicGroups = useCallback(async () => {
    // Evitar llamadas duplicadas
    if (fetchingRef.current) {
      return;
    }

    // Verificar si los parámetros cambiaron
    if (lastSearchParamsRef.current === filtersKey) {
      return;
    }

    try {
      fetchingRef.current = true;
      lastSearchParamsRef.current = filtersKey;
      setLoadingGroups(true);
      
      // Parsear la clave para obtener los filtros
      const parsedFilters = JSON.parse(filtersKey);
      
      // Preparar parámetros de búsqueda con los filtros actuales
      const searchParams = {
        public: true,
        limit: 20,
        ...(parsedFilters.university && { university: parsedFilters.university }),
        ...(parsedFilters.career && { career: parsedFilters.career }),
        ...(parsedFilters.semester && { semester: parsedFilters.semester }),
        ...(parsedFilters.subject && { subject: parsedFilters.subject }),
        ...(parsedFilters.query && { q: parsedFilters.query })
      };
      
      const response = await searchGroups(searchParams);
      const groups = response?.data?.groups || response?.groups || [];
      
      // Filtrar grupos donde el usuario ya es miembro activo
      const filteredGroups = groups.filter(group => {
        // Excluir si es miembro activo (no mostrar grupos donde ya está)
        return !(group.is_member === true || group.is_user_member === true);
      });
      
      setPublicGroups(filteredGroups);
    } catch (error) {
      // Si hay error, resetear la clave para permitir reintento
      lastSearchParamsRef.current = "";
      addToast('Error al cargar grupos públicos', 'error');
    } finally {
      setLoadingGroups(false);
      fetchingRef.current = false;
    }
  }, [filtersKey, searchGroups, addToast]);
  
  // Función para forzar actualización (usada por el botón)
  const forceRefreshGroups = useCallback(() => {
    lastSearchParamsRef.current = "";
    fetchPublicGroups();
  }, [fetchPublicGroups]);
  
  // Efecto consolidado para cargar grupos cuando cambian los filtros o la pestaña
  useEffect(() => {
    if (activeTab === 'groups') {
      fetchPublicGroups();
    }
  }, [activeTab, filtersKey, fetchPublicGroups]);

  // Función para buscar grupo por código de invitación
  const handleSearchByInviteCode = async () => {
    if (!inviteCode.trim()) {
      addToast('Por favor ingresa un código de invitación', 'error');
      return;
    }

    try {
      setLoadingInviteCode(true);
      const response = await groupsAPI.getGroupByInviteCode(inviteCode.trim());
      if (response?.success && response?.data?.group) {
        setSearchedGroup(response.data.group);
        addToast('Grupo encontrado', 'success');
      } else {
        throw new Error('Grupo no encontrado');
      }
    } catch (error) {
      setSearchedGroup(null);
      addToast(
        error.response?.data?.message || 
        error.message || 
        'No se encontró un grupo con ese código',
        'error'
      );
    } finally {
      setLoadingInviteCode(false);
    }
  };

  // Función para actualizar un grupo cuando se une
  const handleGroupUpdated = useCallback((groupId, updates) => {
    // Si el usuario se unió exitosamente (is_member === true), eliminar el grupo de las listas
    if (updates?.is_member === true) {
      // Eliminar de grupos públicos
      setPublicGroups(prev => prev.filter(g => g.id !== groupId));
      
      // Eliminar de recomendaciones
      fetchGroupRecommendations();
      
      // Si es el grupo buscado, mantenerlo pero actualizar su estado
      if (searchedGroup?.id === groupId) {
        setSearchedGroup(prev => ({ ...prev, ...updates }));
      }
      
      return; // No recargar si el usuario se unió exitosamente
    }
    
    // Si solo es una actualización de estado (pendiente, etc.), actualizar normalmente
    setPublicGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, ...updates } : g
    ));
    
    // Actualizar el grupo buscado si es el mismo
    if (searchedGroup?.id === groupId) {
      setSearchedGroup(prev => ({ ...prev, ...updates }));
    }
    
    // Recargar grupos públicos para obtener datos actualizados solo si no se unió directamente
    if (activeTab === 'groups' && !updates?.is_member) {
      fetchPublicGroups();
    }
    
    // Recargar recomendaciones si estamos en la pestaña de descubrimiento y no se unió directamente
    if (activeTab === 'discover' && !updates?.is_member) {
      fetchGroupRecommendations();
    }
  }, [activeTab, fetchPublicGroups, fetchGroupRecommendations, searchedGroup]);

  const openGroupModal = (group) => {
    setSelectedGroup(group);
    setShowGroupModal(true);
  };

  const closeGroupModal = () => {
    setShowGroupModal(false);
    setSelectedGroup(null);
    setJoiningGroup(false);
  };

  const handleJoinFromModal = async () => {
    if (!selectedGroup) return;
    try {
      setJoiningGroup(true);
      const response = await joinGroup(selectedGroup.id);
      if (response?.success) {
        addToast("Solicitud enviada correctamente", "success");
        setSelectedGroup((prev) =>
          prev ? { ...prev, is_member: true } : prev
        );
        fetchGroupRecommendations();
        forceRefreshGroups();
      } else {
        throw new Error(response?.message || "No se pudo enviar la solicitud");
      }
    } catch (error) {
      addToast(
        error.response?.data?.message ||
          error.message ||
          "Error al unirse al grupo",
        "error"
      );
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleChatFromModal = () => {
    if (!selectedGroup) return;
    navigate({ pathname: '/user/panel', search: `?group=${selectedGroup.id}` });
    closeGroupModal();
  };

  return (
    <div className="w-full p-4 md:p-6">

      {/* Banner de Código de Invitación - Compacto */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-[1.5px] shadow-lg"
      >
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-shrink-0 p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
              <Key className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-700 mb-1">
                ¿Tienes un código de invitación?
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Ingresa el código aquí..."
                  className="flex-1 min-w-[180px] px-3 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm font-semibold text-gray-900"
                  maxLength={10}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchByInviteCode();
                    }
                  }}
                />
                <button
                  onClick={handleSearchByInviteCode}
                  disabled={loadingInviteCode || !inviteCode.trim()}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md ${
                    loadingInviteCode
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 hover:scale-105 active:scale-95'
                  }`}
                >
                  {loadingInviteCode ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Buscar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Efecto de brillo animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer pointer-events-none"></div>
      </motion.div>

      {/* Filtros - Visibles en PC, ocultos en móvil */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 md:p-5 mb-6"
      >
        {/* Botón para móvil */}
        <div className="flex items-center justify-between mb-3 md:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm ${
              showFilters
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros</span>
            {showFilters && <X className="w-4 h-4" />}
          </button>
          {(filters.university || filters.career || filters.semester || filters.subject) && (
            <button
              onClick={() => setFilters({ university: "", career: "", semester: "", subject: "" })}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Filtros - Siempre visibles en desktop, condicionales en móvil */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Filtrar por:</p>
            {(filters.university || filters.career || filters.semester || filters.subject) && (
              <button
                onClick={() => setFilters({ university: "", career: "", semester: "", subject: "" })}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Universidad</label>
              <select
                value={filters.university}
                onChange={(e) => setFilters(prev => ({ ...prev, university: e.target.value }))}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
              >
                <option value="">Todas las universidades</option>
                <option value="uch">Universidad de Chile</option>
                <option value="uc">Universidad Católica</option>
                <option value="usm">Universidad Santa María</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Carrera</label>
              <select
                value={filters.career}
                onChange={(e) => setFilters(prev => ({ ...prev, career: e.target.value }))}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
              >
                <option value="">Todas las carreras</option>
                <option value="ing-civil">Ingeniería Civil</option>
                <option value="medicina">Medicina</option>
                <option value="ing-comercial">Ingeniería Comercial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Semestre</label>
              <select
                value={filters.semester}
                onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
              >
                <option value="">Todos los semestres</option>
                <option value="1-3">1° - 3° semestre</option>
                <option value="4-6">4° - 6° semestre</option>
                <option value="7+">7° semestre o más</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Materia</label>
              <input
                type="text"
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Ej: Matemáticas"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
              />
            </div>
          </div>
          {/* Chips de filtros activos - Desktop */}
          {(filters.university || filters.career || filters.semester || filters.subject) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              {filters.university && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {filters.university}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, university: "" }))}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.career && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {filters.career}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, career: "" }))}
                    className="hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.semester && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {filters.semester}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, semester: "" }))}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.subject && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                  {filters.subject}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, subject: "" }))}
                    className="hover:bg-orange-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Filtros - Móvil (ocultos por defecto) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden md:hidden"
            >
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Filtrar por:</p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Universidad</label>
                    <select
                      value={filters.university}
                      onChange={(e) => setFilters(prev => ({ ...prev, university: e.target.value }))}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    >
                      <option value="">Todas las universidades</option>
                      <option value="uch">Universidad de Chile</option>
                      <option value="uc">Universidad Católica</option>
                      <option value="usm">Universidad Santa María</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Carrera</label>
                    <select
                      value={filters.career}
                      onChange={(e) => setFilters(prev => ({ ...prev, career: e.target.value }))}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    >
                      <option value="">Todas las carreras</option>
                      <option value="ing-civil">Ingeniería Civil</option>
                      <option value="medicina">Medicina</option>
                      <option value="ing-comercial">Ingeniería Comercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Semestre</label>
                    <select
                      value={filters.semester}
                      onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    >
                      <option value="">Todos los semestres</option>
                      <option value="1-3">1° - 3° semestre</option>
                      <option value="4-6">4° - 6° semestre</option>
                      <option value="7+">7° semestre o más</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Materia</label>
                    <input
                      type="text"
                      value={filters.subject}
                      onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Ej: Matemáticas"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    />
                  </div>
                </div>
                {/* Chips de filtros activos - Móvil */}
                {(filters.university || filters.career || filters.semester || filters.subject) && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                    {filters.university && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {filters.university}
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, university: "" }))}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filters.career && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {filters.career}
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, career: "" }))}
                          className="hover:bg-purple-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filters.semester && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {filters.semester}
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, semester: "" }))}
                          className="hover:bg-green-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filters.subject && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {filters.subject}
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, subject: "" }))}
                          className="hover:bg-orange-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Pestañas Mejoradas */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <nav className="flex space-x-2 bg-gray-100 p-1.5 rounded-xl">
            {[
              {
                id: "discover",
                label: "Recomendados",
                icon: Sparkles,
                count: groupRecommendations.length,
                description: "Para ti"
              },
              {
                id: "groups",
                label: "Todos",
                icon: Target,
                count: publicGroups.length,
                description: "Explorar"
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchedGroup(null);
                  setInviteCode("");
                }}
                className={`relative px-5 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap flex items-center space-x-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : ''}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`py-0.5 px-2 rounded-full text-xs font-bold ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
          {activeTab === "discover" && (
            <button
              onClick={() => fetchGroupRecommendations()}
              disabled={matchingLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${matchingLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          )}
          {activeTab === "groups" && (
            <button
              onClick={forceRefreshGroups}
              disabled={loadingGroups}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingGroups ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenido de las pestañas */}
      <div>
        {activeTab === "discover" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Grupos Recomendados para Ti
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                Basado en tu perfil académico y compatibilidad
              </p>
            </div>

            {matchingError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{matchingError}</p>
              </div>
            )}

            {matchingLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Buscando recomendaciones perfectas para ti...</p>
              </div>
            ) : groupRecommendations.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
                  <Sparkles className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No hay recomendaciones disponibles
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Explora más grupos y completa tu perfil para obtener recomendaciones personalizadas
                </p>
                <button
                  onClick={() => setActiveTab("groups")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
                >
                  Explorar Todos los Grupos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
                {groupRecommendations.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ExplorerGroupCard
                      group={group}
                      showJoinButton={true}
                      onGroupUpdated={handleGroupUpdated}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "groups" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Todos los Grupos Públicos
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                Explora todos los grupos disponibles en la plataforma
              </p>
            </div>
            {loadingGroups ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Cargando grupos...</p>
              </div>
            ) : publicGroups.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
                  <Users className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No hay grupos disponibles
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Sé el primero en crear un grupo de estudio y conecta con otros estudiantes
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {publicGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ExplorerGroupCard
                      group={group}
                      showJoinButton={true}
                      onGroupUpdated={handleGroupUpdated}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Resultado de búsqueda por código de invitación */}
        {searchedGroup && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-semibold">¡Grupo encontrado!</p>
              </div>
            </div>
            <ExplorerGroupCard
              group={searchedGroup}
              showJoinButton={true}
              onGroupUpdated={handleGroupUpdated}
              inviteCode={inviteCode.trim()} // Pasar el código de invitación
            />
          </motion.div>
        )}
      </div>

      {showGroupModal && selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          isMember={Boolean(selectedGroup.is_member)}
          onClose={closeGroupModal}
          onJoin={handleJoinFromModal}
          onChat={handleChatFromModal}
          loading={joiningGroup}
        />
      )}
    </div>
  );
};

export default ExplorerSection;
