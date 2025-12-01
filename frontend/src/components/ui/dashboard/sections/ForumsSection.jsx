import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Users,
  Lock,
  Globe,
  Clock,
  Filter
} from "lucide-react";
import { useForums } from "../../../../hooks/useForums.js";
import { useToast } from "../../../ui/Toast";
import CreateForumModal from "../../../modals/forums/CreateForumModal";
import ForumDetailsModal from "../../../modals/forums/ForumDetailsModal";
import { ForumCard } from "../../../ui/cards/landing/ForumCard";

const ForumsSection = ({ user, groups = [] }) => {
  const [forums, setForums] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForum, setSelectedForum] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showForumModal, setShowForumModal] = useState(false);
  const [filterGroup, setFilterGroup] = useState("all");
  const { getForums, loading } = useForums();
  const { addToast } = useToast();

  // Cargar foros al montar
  useEffect(() => {
    loadForums();
  }, [filterGroup]);

  const loadForums = async () => {
    try {
      const params = {};
      if (filterGroup !== "all") {
        params.group_id = filterGroup;
      }
      const response = await getForums(params);
      if (response?.data?.forums) {
        setForums(response.data.forums);
      }
    } catch (error) {
      // Error loading forums
    }
  };

  const handleForumClick = async (forum) => {
    setSelectedForum(forum);
    setShowForumModal(true);
  };

  const handleForumCreated = () => {
    setShowCreateModal(false);
    loadForums();
  };

  const handlePostCreated = () => {
    loadForums();
  };

  const filteredForums = forums.filter((forum) => {
    const matchesSearch =
      forum.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      forum.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="w-full p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Foro</span>
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar foros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los foros</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de foros */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando foros...</p>
        </div>
      ) : filteredForums.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay foros disponibles
          </h3>
          <p className="text-gray-600 mb-4">
            Sé el primero en crear un foro y comenzar una discusión
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Crear Primer Foro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
          {filteredForums.map((forum) => (
            <ForumCard
              key={forum.id}
              forum={forum}
              onClick={() => handleForumClick(forum)}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {showCreateModal && (
        <CreateForumModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onForumCreated={handleForumCreated}
          groups={groups}
        />
      )}

      {showForumModal && selectedForum && (
        <ForumDetailsModal
          isOpen={showForumModal}
          onClose={() => {
            setShowForumModal(false);
            setSelectedForum(null);
          }}
          forum={selectedForum}
          user={user}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default ForumsSection;

