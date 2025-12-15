import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  MessageCircle,
  Send,
  Users,
  FileText,
  User,
  Clock,
  BookOpen,
  Download,
  Plus,
  Trash2,
} from "lucide-react";
import { useToast } from "../../../ui/Toast";
import SessionFeedbackModal from "../../../modals/sessions/SessionFeedbackModal";
import { getAuthToken } from "../../../../services/tokenManager";
import Avatar from "../../../ui/Avatar";
import ChatUI from "../../dashboard/shared/ChatUI";
import { useSocket } from "../../../../contexts/SocketContext";
import SessionResourceLibraryModal from "../../../modals/sessions/SessionResourceLibraryModal";
import { ResourceCard } from "../../../ui/cards/landing/ResourceCard";
import { api } from "../../../../services/api";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ActiveSessionSection = ({ session: initialSession, user, onLeaveSession }) => {
  const { addToast } = useToast();
  const { isConnected, messages, joinSession, leaveSession, sendSessionMessage, socket } = useSocket();

  /* -------------------- state -------------------- */
  const [session, setSession] = useState(initialSession);
  // Chat state managed by SocketContext now, but we prepare data
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatHiddenCount, setChatHiddenCount] = useState(0); // State for pagination if needed
  const [showChatAll, setShowChatAll] = useState(false); // State for pagination if needed

  const [participants, setParticipants] = useState([]);
  const [resources, setResources] = useState([]);
  const [sessionResources, setSessionResources] = useState([]);
  const [showResourceLibrary, setShowResourceLibrary] = useState(false);
  const loadedSessionRef = useRef(null);

  // Collaborative notes - each user has their own note, all visible to everyone
  const [personalNotes, setPersonalNotes] = useState("");
  const [savedPersonalNotes, setSavedPersonalNotes] = useState("");
  const [allPersonalNotes, setAllPersonalNotes] = useState([]);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionTimeExpired, setSessionTimeExpired] = useState(false);

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  /* -------------------- derived -------------------- */
  const sessionId = session?.sessionData?.id || session?.id;

  const isOrganizer = useMemo(() => {
    return (
      session?.organizer?.id === user?.id ||
      session?.sessionData?.organizer?.id === user?.id
    );
  }, [session, user]);

  /* -------------------- helpers -------------------- */
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* -------------------- effects -------------------- */

  // Sync prop with state
  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  // Fetch full details if missing
  useEffect(() => {
    if (!session) return;

    const needsFetch = session.session_attendance?.length > 0 &&
      !session.session_attendance[0].users &&
      !session.session_attendance[0].user;

    if (needsFetch) {
      const fetchDetails = async () => {
        try {
          const token = getAuthToken();
          const res = await fetch(`${API}/sessions/${session.id || session.sessionData?.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data?.session) {
              setSession(prev => ({ ...prev, ...data.data.session }));
            }
          }
        } catch (e) {
          console.error("Error fetching session details:", e);
          addToast("No se pudo cargar los detalles de la sesión. Verifica tu conexión e intenta nuevamente.", "error");
        }
      };
      fetchDetails();
    }
  }, [session?.id, session?.sessionData?.id]); // Depend on ID only to avoid loops

  // Timer
  useEffect(() => {
    if (!session?.scheduled_date) return;

    const start = new Date(session.scheduled_date).getTime();

    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      setElapsedTime(Math.max(diff, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // Expiration check
  useEffect(() => {
    if (!session?.scheduled_date || !session?.duration) return;

    const start = new Date(session.scheduled_date).getTime();
    const end = start + session.duration * 60000;

    if (Date.now() > end && !sessionTimeExpired) {
      setSessionTimeExpired(true);
      setShowExtendModal(true);
    }
  }, [elapsedTime, session, sessionTimeExpired]);

  // Load session resources - SIMPLIFIED
  useEffect(() => {
    if (!sessionId) return;

    // Prevent duplicate loads
    if (loadedSessionRef.current === sessionId) return;

    const loadResources = async () => {
      try {

        loadedSessionRef.current = sessionId;
        const token = getAuthToken();
        const res = await fetch(`${API}/sessions/${sessionId}/resources`, {
          headers: { Authorization: `Bearer ${token}` }
        });


        if (res.ok) {
          const data = await res.json();

          setSessionResources(data.data?.resources || []);
        } else {


        }
      } catch (e) {

        loadedSessionRef.current = null;
      }
    };

    loadResources();
  }, [sessionId]);

  // Function to reload resources (for after adding/removing)
  const reloadSessionResources = useCallback(() => {

    loadedSessionRef.current = null;
    // Trigger reload by clearing and re-fetching
    const loadResources = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API}/sessions/${sessionId}/resources`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();

          setSessionResources(data.data?.resources || []);
        }
      } catch (e) {

      }
    };
    loadResources();
  }, [sessionId]);

  const handleRemoveResource = async (fileId) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/sessions/${sessionId}/resources/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast("Recurso quitado de la sesión", "success");
        reloadSessionResources();
      }
    } catch (e) {
      addToast("Error quitando recurso", "error");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getResourceTypeName = (type) => {
    const ext = type?.toLowerCase() || '';
    const typeMap = {
      'pdf': '📄 PDF',
      'doc': '📝 Word',
      'docx': '📝 Word',
      'ppt': '📊 PowerPoint',
      'pptx': '📊 PowerPoint',
    };
    return typeMap[ext] || '📄 Documento';
  };

  // Load participants / resources / welcome message
  useEffect(() => {
    if (!session) return;

    const rawParticipants =
      session.session_attendance || session.attendees || session.participants || [];

    const formatted = rawParticipants.map((p) => {
      // Manejar estructura de Supabase con alias 'users' o structure directa
      const userData = p.users || p.user || p;
      const id = userData.id || p.user_id || p.id;
      const isCurrentUser = id === user?.id;

      let name = userData.name || userData.username || p.name;

      // Si no tenemos nombre y es el usuario actual, usar el del prop 'user'
      if (!name && isCurrentUser) {
        name = user?.name || "Tú";
      }

      return {
        id,
        name: name || "Usuario",
        avatar: userData.avatar, // Agregar avatar si existe
        isCurrentUser,
      };
    });

    if (user && !formatted.some((p) => p.isCurrentUser)) {
      formatted.push({ id: user.id, name: user.name || "Tú", isCurrentUser: true });
    }

    setParticipants(formatted);

    const res = session.resources || session.groups?.resources || [];
    setResources(
      res.map((r) => ({
        id: r.id,
        name: r.name || r.title || "Recurso",
        url: r.url || r.link || "#",
      }))
    );

    // Load collaborative notes from session
    if (session.session_notes) {
      const notesData = session.session_notes;


      let personal = [];

      // Handle different formats
      if (typeof notesData === 'object') {
        // New format with personal_notes array
        personal = notesData.personal_notes || [];



        // Set all personal notes for display
        setAllPersonalNotes(Array.isArray(personal) ? personal : []);

        // Find current user's personal note
        const myNote = Array.isArray(personal)
          ? personal.find(n => n.user_id === user?.id)
          : null;

        if (myNote) {
          setSavedPersonalNotes(myNote.note || '');
          setPersonalNotes(myNote.note || '');
        }
      }
    } else {

      setSavedPersonalNotes('');
      setAllPersonalNotes([]);
      setPersonalNotes('');
    }

    // Join Socket Session (Isolated Channel)
    const sessionId = session?.id || session?.sessionData?.id;
    if (sessionId) {
      joinSession(sessionId);
    }

    return () => {
      if (sessionId) leaveSession(sessionId);
    };
  }, [session, user, joinSession, leaveSession, isOrganizer]);

  // Socket.IO listeners for real-time updates
  useEffect(() => {
    if (!socket || !sessionId) return;

    const handleResourceAdded = (data) => {
      if (data.sessionId === sessionId) {
        reloadSessionResources();
        addToast('Nuevo recurso agregado a la sesión', 'info');
      }
    };

    const handleResourceRemoved = (data) => {
      if (data.sessionId === sessionId) {
        reloadSessionResources();
        addToast('Recurso quitado de la sesión', 'info');
      }
    };

    const handlePersonalNoteUpdated = (data) => {
      if (data.sessionId === sessionId && data.personalNote) {
        // Update allPersonalNotes with the new/updated note
        setAllPersonalNotes(prev => {
          // Remove old note from this user if exists
          const filtered = prev.filter(n => n.user_id !== data.personalNote.user_id);
          // Add the updated note
          return [...filtered, data.personalNote].sort((a, b) =>
            new Date(b.updated_at) - new Date(a.updated_at)
          );
        });

        // If it's not the current user's note, show a toast
        if (data.personalNote.user_id !== user?.id) {
          addToast(`${data.personalNote.user_name} actualizó sus notas`, 'info');
        }
      }
    };

    socket.on('sessionResourceAdded', handleResourceAdded);
    socket.on('sessionResourceRemoved', handleResourceRemoved);
    socket.on('personalNoteUpdated', handlePersonalNoteUpdated);

    return () => {
      socket.off('sessionResourceAdded', handleResourceAdded);
      socket.off('sessionResourceRemoved', handleResourceRemoved);
      socket.off('personalNoteUpdated', handlePersonalNoteUpdated);
    };
  }, [socket, sessionId, addToast, user?.id, reloadSessionResources]);

  // Transform Socket Messages for ChatUI
  // Use session-specific messages from context using outer sessionId
  const rawMessages = messages[sessionId] || [];

  const formattedMessages = useMemo(() => {
    // Ordenar y limitar si es necesario
    const sorted = [...rawMessages].sort((a, b) => new Date(a.created_at || a.timestamp || 0) - new Date(b.created_at || b.timestamp || 0));
    const visible = showChatAll ? sorted : sorted.slice(-50); // Hardcoded limit for session view or use same logic
    // We can reuse logic or just show all for now.

    return visible.map(m => ({
      id: m.id || m.tempId,
      content: m.content || m.message || '',
      sender: {
        id: m.sender?.id || m.user_id,
        name: m.sender?.name || m.user?.name || "Usuario",
        avatar: m.sender?.avatar,
        isCurrentUser: (m.sender?.id || m.user_id) === user?.id
      },
      timestamp: new Date(m.created_at || m.timestamp || Date.now()).getTime(),
      isOwn: (m.sender?.id || m.user_id) === user?.id
    }));
  }, [rawMessages, user?.id, showChatAll]);

  /* -------------------- actions -------------------- */

  const sendMessage = async (text) => {
    const sessionId = session?.id || session?.sessionData?.id;
    if (!text.trim() || isSendingMessage || !sessionId) return;

    setIsSendingMessage(true);
    try {
      await sendSessionMessage({ sessionId, content: text });
    } catch (e) {
      console.error("Socket send error", e);
      addToast("Error enviando mensaje", "error");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const savePersonalNotes = async () => {
    if (!personalNotes.trim()) return;

    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/sessions/${sessionId}/notes/personal`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: personalNotes.trim() }),
      });

      if (!res.ok) throw new Error("Error al guardar");

      const data = await res.json();
      addToast("Notas personales guardadas", "success");
      setSavedPersonalNotes(personalNotes.trim());

      // Update allPersonalNotes with the new note
      if (data.data?.personal_note) {
        setAllPersonalNotes(prev => {
          const filtered = prev.filter(n => n.user_id !== user?.id);
          return [...filtered, data.data.personal_note];
        });
      }
    } catch {
      addToast("Error guardando notas personales", "error");
    }
  };

  const leaveSessionAsParticipant = async () => {
    try {
      const token = getAuthToken();
      await fetch(`${API}/sessions/${sessionId}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      onLeaveSession();
    } catch {
      addToast("Error al salir", "error");
    }
  };

  const endSession = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/sessions/${sessionId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!res.ok) throw new Error("Error al terminar");

      setShowFeedbackModal(true);
    } catch {
      addToast("Error terminando sesión", "error");
    }
  };

  const handleLeaveSession = async () => {
    if (isOrganizer) setShowEndSessionModal(true);
    else await leaveSessionAsParticipant();
  };

  const handleSubmitFeedback = async (feedbackData) => {
    try {
      await api.sessions.submitFeedback(sessionId, {
        ...feedbackData,
        session_notes: personalNotes
      });
      addToast("Feedback enviado correctamente", "success");
    } catch (e) {
      addToast("Error enviando feedback", "error");
    }
  };

  if (!session) {
    return <div className="h-64 flex items-center justify-center">No hay sesión activa</div>;
  }

  /* -------------------- render -------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{session.title}</h1>
            <div className="text-sm opacity-90 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> {session.groups?.name || "Grupo"}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm flex flex-col h-[600px]">
          <ChatUI
            title="Chat de Sesión"
            subtitle={`${session.title} - ${participants.length} participantes`}
            isConnected={isConnected}
            messages={formattedMessages}
            onSendMessage={(text) => sendMessage(text)}
            currentUserId={user?.id}
            isSending={isSendingMessage}
            onLoadMore={() => setShowChatAll(true)}
            hiddenCount={rawMessages.length - formattedMessages.length}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Collaborative Notes - All visible, each identified by author */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Notas de la Sesión
              <span className="text-xs text-gray-500 ml-auto">
                {allPersonalNotes.length} {allPersonalNotes.length === 1 ? 'participante' : 'participantes'}
              </span>
            </h3>

            {/* My Note - Editable */}
            <div className="mb-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-blue-700">
                  {user?.name || 'Tú'} (Tú)
                </span>
                <span className="text-xs text-blue-600">
                  {savedPersonalNotes ? '✓ Guardado' : 'Sin guardar'}
                </span>
              </div>
              <textarea
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                rows={3}
                placeholder="Escribe tus notas aquí..."
                className="w-full border border-blue-200 rounded-lg px-3 py-2 mb-2 text-sm bg-white focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
              />
              <button
                onClick={savePersonalNotes}
                disabled={!personalNotes.trim() || personalNotes.trim() === savedPersonalNotes}
                className="w-full bg-blue-600 text-white rounded-lg py-1.5 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {savedPersonalNotes ? 'Actualizar Mis Notas' : 'Guardar Mis Notas'}
              </button>
            </div>

            {/* Other Participants' Notes - Read Only */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {allPersonalNotes
                .filter(note => note.user_id !== user?.id)
                .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                .map((note) => (
                  <div
                    key={note.user_id}
                    className="border-l-4 border-gray-300 bg-gray-50 rounded-r-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {note.user_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(note.updated_at).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {note.note}
                    </p>
                  </div>
                ))}

              {allPersonalNotes.filter(n => n.user_id !== user?.id).length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aún no hay notas de otros participantes</p>
                  <p className="text-xs mt-1">Sé el primero en compartir tus apuntes</p>
                </div>
              )}
            </div>
          </div>

          {/* Session Resources */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Recursos de Sesión
              </h3>
              <button
                onClick={() => setShowResourceLibrary(true)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {sessionResources.length > 0 ? (
                sessionResources.map((resource) => (
                  <div key={resource.id} className="relative">
                    <ResourceCard
                      resource={resource}
                      getResourceTypeName={getResourceTypeName}
                      formatFileSize={formatFileSize}
                      onDownload={async (id) => {
                        try {
                          const token = getAuthToken();
                          const res = await fetch(`${API}/resources/${id}/download`, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          if (res.ok) {
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = resource.name;
                            a.click();
                          }
                        } catch (e) {
                          addToast("Error descargando recurso", "error");
                        }
                      }}
                      onDelete={isOrganizer ? () => handleRemoveResource(resource.id) : null}
                      canDelete={isOrganizer}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No hay recursos agregados</p>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b font-medium">
              Participantes ({participants.length})
            </div>
            <div className="p-4 space-y-2">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Avatar
                    userId={p.id || p.email || 'user'}
                    name={p.name || p.username || 'Usuario'}
                    avatar={p.avatar_url || null}
                    avatarStyle={p.avatar}
                    size="md"
                    showBorder={false}
                  />
                  <span className="text-sm">
                    {p.name} {p.isCurrentUser && "(Tú)"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleLeaveSession}
            className={`w-full py-2 rounded-lg text-white ${isOrganizer ? "bg-red-600" : "bg-gray-600"
              }`}
          >
            {isOrganizer ? "Terminar Sesión" : "Salir"}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showEndSessionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full">
            <h3 className="font-bold mb-4">¿Terminar sesión?</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEndSessionModal(false)}
                className="flex-1 border rounded-lg py-2"
              >
                Cancelar
              </button>
              <button
                onClick={endSession}
                className="flex-1 bg-red-600 text-white rounded-lg py-2"
              >
                Terminar
              </button>
            </div>
          </div>
        </div>
      )}

      <SessionFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          onLeaveSession();
        }}
        sessionData={{ title: session.title, group: session.groups?.name }}
        onSubmitFeedback={handleSubmitFeedback}
      />

      <SessionResourceLibraryModal
        isOpen={showResourceLibrary}
        onClose={() => setShowResourceLibrary(false)}
        sessionId={sessionId}
        groupId={session?.group_id || session?.groups?.id}
        onResourceAdded={reloadSessionResources}
      />
    </div>
  );
};

export default ActiveSessionSection;
