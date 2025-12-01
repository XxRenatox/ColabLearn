import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Users,
  FileText,
  Link as LinkIcon,
  User,
  Clock,
  Radio,
  BookOpen,
  Loader,
  Download,
} from "lucide-react";
import { useToast } from "../../../ui/Toast";
import { useSessionWebSocket } from "../../../../hooks/useWebSocket";
import SessionFeedbackModal from "../../../modals/sessions/SessionFeedbackModal";
import { getAuthToken } from "../../../../services/tokenManager";
import Avatar from "../../../ui/Avatar";

const ActiveSessionSection = ({ session, user, onLeaveSession }) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [resources, setResources] = useState([]);
  const [sessionTimeExpired, setSessionTimeExpired] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const { addToast } = useToast();

  // Verificar si el usuario es organizador/admin de la sesión
  const isOrganizer =
    session?.organizer?.id === user?.id ||
    session?.sessionData?.organizer?.id === user?.id;

  // WebSocket para chat en tiempo real (temporalmente desactivado)
  // const { isConnected, sessionMessages, sendSessionMessage } = useSessionWebSocket(
  //   session?.sessionData?.id || session?.id,
  //   user?.id
  // );

  // Estado para simular WebSocket
  const [isConnected, setIsConnected] = useState(false);
  const [sessionMessages, setSessionMessages] = useState([]);

  // Simular conexión WebSocket (temporal)
  useEffect(() => {
    // Simular que el WebSocket no está disponible
    setIsConnected(false);
    setSessionMessages([]);
  }, []);

  // Temporizador para verificar si la sesión ha expirado
  useEffect(() => {
    if (!session || !session.scheduled_date || !session.duration) return;

    const checkSessionTime = () => {
      const now = new Date();
      const sessionStart = new Date(session.scheduled_date);
      const sessionEnd = new Date(
        sessionStart.getTime() + session.duration * 60000
      ); // duración en minutos

      if (now > sessionEnd && !sessionTimeExpired) {
        setSessionTimeExpired(true);
        setShowExtendModal(true);
      }
    };

    // Verificar cada minuto
    const interval = setInterval(checkSessionTime, 60000);

    // Verificar inmediatamente
    checkSessionTime();

    return () => clearInterval(interval);
  }, [session, sessionTimeExpired]);

  // Extender sesión
  const extendSession = async (additionalMinutes = 30) => {
    try {
      const token = getAuthToken();
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/sessions/${session?.sessionData?.id || session?.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            duration: session.duration + additionalMinutes,
          }),
        }
      );

      if (!res.ok) throw new Error("Error extendiendo sesión");

      addToast(`Sesión extendida por ${additionalMinutes} minutos`, "success");
      setSessionTimeExpired(false);
      setShowExtendModal(false);
    } catch (error) {
      addToast("Error extendiendo la sesión", "error");
    }
  };

  // Terminar sesión (solo para organizador)
  const endSession = async () => {
    if (!isOrganizer) {
      addToast("Solo el organizador puede terminar la sesión", "error");
      return;
    }

    try {
      const token = getAuthToken();
      const sessionId = session?.sessionData?.id || session?.id;

      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/sessions/${sessionId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText}`);
      }

      const responseData = await res.json();

      // Mostrar modal de feedback después de terminar la sesión
      setShowFeedbackModal(true);

      addToast("Sesión terminada exitosamente", "success");
      // No llamar onLeaveSession() aquí, esperar a que el usuario cierre el feedback
    } catch (error) {
      addToast(`Error terminando la sesión: ${error.message}`, "error");
    }
  };

  // Salir de la sesión como participante
  const leaveSessionAsParticipant = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/sessions/${session?.sessionData?.id || session?.id}/leave`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Error al salir");
      addToast("Has salido de la sesión", "success");
      onLeaveSession();
    } catch (error) {
      addToast("Error al salir de la sesión", "error");
    }
    // Guardar notas de sesión
    const saveSessionNotes = async () => {
      if (!sessionNotes.trim()) return;

      try {
        const token = getAuthToken();
        const sessionId = session?.sessionData?.id || session?.id;

        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          }/sessions/${sessionId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              session_notes: {
                notes: sessionNotes.trim(),
                created_by: user?.id,
                created_at: new Date().toISOString(),
              },
            }),
          }
        );

        if (!res.ok) throw new Error("Error guardando notas");

        addToast("Notas guardadas exitosamente", "success");
      } catch (error) {
        addToast("Error guardando notas", "error");
      }
    };

    // Guardar chat de la sesión
    const saveChatHistory = async () => {
      try {
        const token = getAuthToken();
        const sessionId = session?.sessionData?.id || session?.id;

        const chatData = {
          messages: chatMessages,
          saved_at: new Date().toISOString(),
          saved_by: user?.id,
        };

        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          }/sessions/${sessionId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_history: chatData,
            }),
          }
        );

        if (!res.ok) throw new Error("Error guardando chat");

        addToast("Chat guardado exitosamente", "success");
      } catch (error) {
        addToast("Error guardando chat", "error");
      }
    };

    // Enviar feedback de la sesión
    const handleFeedbackSubmit = async (feedbackData) => {
      try {
        const token = getAuthToken();

        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          }/sessions/${feedbackData.sessionId}/feedback`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              rating: feedbackData.rating,
              comment: feedbackData.comment,
              session_type: feedbackData.sessionType,
              duration: feedbackData.duration,
            }),
          }
        );

        if (!res.ok) throw new Error("Error enviando feedback");

        addToast("Feedback enviado exitosamente", "success");

        // Después de enviar feedback, salir de la sesión
        onLeaveSession();
      } catch (error) {
        addToast("Error enviando feedback", "error");
        // Aún así salir si hay error
        onLeaveSession();
      }
    };

    const sessionTypes = [
      { value: "study", label: "Sesión de Estudio", icon: BookOpen },
      { value: "review", label: "Repaso", icon: BookOpen },
      { value: "exam_prep", label: "Preparación de Examen", icon: BookOpen },
      { value: "project", label: "Trabajo en Proyecto", icon: Users },
      { value: "discussion", label: "Discusión", icon: Users },
      { value: "tutoring", label: "Tutoría", icon: Users },
    ];

    // Cargar datos de la sesión
    useEffect(() => {
      if (!session) return;

      // Usar participantes reales de la sesión
      const sessionParticipants =
        session.attendees || session.participants || [];
      const formattedParticipants = sessionParticipants.map((attendee) => {
        const attendeeId = attendee.id || attendee.user_id || attendee.user?.id;
        const attendeeName =
          attendee.name ||
          attendee.user?.name ||
          attendee.username ||
          "Usuario";
        const attendeeRole =
          attendee.role || attendee.participant_role || "member";

        return {
          id: attendeeId,
          name: attendeeName,
          role: attendeeRole,
          isCurrentUser: attendeeId === user?.id,
        };
      });

      // Agregar el usuario actual si no está en la lista
      const currentUserInList = formattedParticipants.some(
        (p) => p.isCurrentUser
      );
      if (!currentUserInList && user) {
        formattedParticipants.push({
          id: user.id,
          name: user.name || "Tú",
          role: "member",
          isCurrentUser: true,
        });
      }

      setParticipants(formattedParticipants);

      // Usar recursos reales de la sesión o del grupo
      const sessionResources =
        session.resources || session.groups?.resources || [];
      const formattedResources = sessionResources.map((resource) => ({
        id: resource.id,
        name: resource.name || resource.title || "Recurso sin nombre",
        type: resource.type || resource.resource_type || "document",
        url: resource.url || resource.link || "#",
      }));
      setResources(formattedResources);

      // Mensaje de bienvenida
      setChatMessages([
        {
          id: 1,
          user: "Sistema",
          message: `¡Bienvenido a la sesión "${
            session.title || session.sessionData?.title
          }"!`,
          timestamp: new Date().toISOString(),
          type: "system",
        },
      ]);
    }, [session, user]);

    // Manejar mensajes entrantes del WebSocket
    useEffect(() => {
      const newMessages = sessionMessages.filter((msg) => {
        // Solo procesar mensajes que no estén ya en el chat
        return !chatMessages.some((existing) => existing.id === msg.id);
      });

      newMessages.forEach((msg) => {
        if (msg.type === "session-message") {
          const chatMessage = {
            id: msg.id || Date.now(),
            user: msg.user || msg.sender || msg.userName || "Usuario",
            message: msg.message,
            timestamp: msg.timestamp || new Date().toISOString(),
            type: "user",
          };
          setChatMessages((prev) => [...prev, chatMessage]);
        } else if (msg.type === "notification" || msg.type === "system") {
          // Manejar notificaciones del sistema
          const systemMessage = {
            id: msg.id || Date.now(),
            user: "Sistema",
            message: msg.message,
            timestamp: msg.timestamp || new Date().toISOString(),
            type: "system",
          };
          setChatMessages((prev) => [...prev, systemMessage]);
        }
      });
    }, [sessionMessages]);

    // Enviar mensaje al chat
    const sendMessage = async () => {
      if (!newMessage.trim() || isSendingMessage) return;

      setIsSendingMessage(true);

      const message = {
        id: Date.now(),
        user: user?.name || "Usuario",
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: "user",
      };

      // Agregar al chat local inmediatamente (sin WebSocket por ahora)
      setChatMessages((prev) => [...prev, message]);
      setNewMessage("");

      // Mostrar mensaje informativo sobre WebSocket
      addToast("Chat funcionando localmente. WebSocket no disponible.", "info");

      setIsSendingMessage(false);
    };

    // --- Descargar chat ---
    const exportChat = () => {
      const content = chatMessages
        .map(
          (m) =>
            `[${new Date(m.timestamp).toLocaleTimeString("es-ES")}] ${
              m.user
            }: ${m.message}`
        )
        .join("\n");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat_${session?.title || "sesion"}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    };

    // Salir de la sesión
    const leaveSession = async () => {
      if (isOrganizer) {
        // Si es organizador, mostrar modal de confirmación para terminar sesión
        setShowEndSessionModal(true);
      } else {
        // Si es participante regular, sale de la sesión
        await leaveSessionAsParticipant();
      }
    };

    if (!session) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No hay sesión activa</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Información de la sesión */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">
                  {session.title || session.sessionData?.title}
                </h2>
                <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                  <Radio className="w-4 h-4 text-green-400 animate-pulse" />
                  <span className="text-sm font-medium text-green-300">
                    EN VIVO
                  </span>
                </div>
              </div>
              <p className="text-blue-100 mt-1">
                {session.groups?.name ||
                  session.group ||
                  "Grupo no especificado"}{" "}
                • Sesión en Vivo
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {session.startTime ||
                      (session.scheduled_date
                        ? new Date(session.scheduled_date).toLocaleTimeString(
                            "es-ES",
                            { hour: "2-digit", minute: "2-digit" }
                          )
                        : "Sin hora")}{" "}
                    -
                    {session.endTime ||
                      (session.scheduled_date && session.duration
                        ? new Date(
                            new Date(session.scheduled_date).getTime() +
                              session.duration * 60000
                          ).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Sin hora")}
                    {sessionTimeExpired && (
                      <span className="text-red-500 ml-2">
                        (Tiempo expirado)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {session.attendee_count ||
                      session.session_attendance?.length ||
                      participants.length}{" "}
                    participantes
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">EN VIVO</span>
              <button
                onClick={leaveSession}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  isOrganizer
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                {isOrganizer ? "Terminar Sesión" : "Salir de la Sesión"}
              </button>
            </div>
          </div>
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {/* Chat Principal */}
          <div className="lg:col-span-2 2xl:col-span-2 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat de la Sesión
                </h3>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  ></div>
                  <span
                    className={`text-xs ${
                      isConnected ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {isConnected ? "Conectado" : "Modo Offline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.type === "system"
                      ? "justify-center"
                      : msg.user === (user?.name || "Usuario")
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      msg.type === "system"
                        ? "bg-gray-200 text-gray-600 text-center text-sm"
                        : msg.user === (user?.name || "Usuario")
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    {msg.type !== "system" && (
                      <div className="text-xs opacity-75 mb-1">{msg.user}</div>
                    )}
                    <div className="text-sm">{msg.message}</div>
                    <div className="text-xs opacity-50 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input de mensaje */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={isSendingMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSendingMessage ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Notas de la Sesión */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notas de la Sesión
              </h3>
              <div className="space-y-3">
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Escribe notas sobre la sesión..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveSessionNotes}
                    disabled={!sessionNotes.trim()}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Guardar Notas
                  </button>
                  <button
                    onClick={saveChatHistory}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Guardar Chat
                  </button>
                </div>
              </div>
            </div>
            {/* Información del Organizador y Sesión */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Información de la Sesión
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    userId={session?.sessionData?.organizer?.id || session?.organizer?.id || session?.organizer?.email || 'organizer'}
                    name={session?.sessionData?.organizer?.name || session?.organizer?.name || "Organizador"}
                    avatar={session?.sessionData?.organizer?.avatar_url || session?.organizer?.avatar_url || null}
                    avatarStyle={session?.sessionData?.organizer?.avatar || session?.organizer?.avatar}
                    size={36}
                    showBorder={false}
                    className="bg-blue-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {session?.sessionData?.organizer?.name ||
                        session?.organizer?.name ||
                        "Organizador"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session?.sessionData?.organizer?.career ||
                        session?.organizer?.career ||
                        ""}{" "}
                      •{" "}
                      {session?.sessionData?.organizer?.university ||
                        session?.organizer?.university ||
                        ""}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium capitalize">
                      {session?.sessionData?.type === "study"
                        ? "Sesión de Estudio"
                        : session?.sessionData?.type === "review"
                        ? "Repaso"
                        : session?.sessionData?.type === "exam_prep"
                        ? "Preparación de Examen"
                        : session?.sessionData?.type === "project"
                        ? "Trabajo en Proyecto"
                        : session?.sessionData?.type === "discussion"
                        ? "Discusión"
                        : session?.sessionData?.type === "tutoring"
                        ? "Tutoría"
                        : session?.type === "study"
                        ? "Sesión de Estudio"
                        : session?.type === "review"
                        ? "Repaso"
                        : session?.type === "exam_prep"
                        ? "Preparación de Examen"
                        : session?.type === "project"
                        ? "Trabajo en Proyecto"
                        : session?.type === "discussion"
                        ? "Discusión"
                        : session?.type === "tutoring"
                        ? "Tutoría"
                        : "No especificado"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Plataforma:</span>
                    <span className="font-medium">
                      {session?.sessionData?.platform ||
                        session?.platform ||
                        "No especificada"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ubicación:</span>
                    <span className="font-medium">
                      {session?.sessionData?.location_type === "virtual"
                        ? "Virtual"
                        : session?.sessionData?.location_type === "physical"
                        ? "Presencial"
                        : session?.location_type === "virtual"
                        ? "Virtual"
                        : session?.location_type === "physical"
                        ? "Presencial"
                        : "No especificada"}
                    </span>
                  </div>
                  {session?.sessionData?.location_details && (
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                      {session.sessionData.location_details}
                    </div>
                  )}
                  {session?.location_details &&
                    !session?.sessionData?.location_details && (
                      <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                        {session.location_details}
                      </div>
                    )}
                </div>
              </div>
            </div>
            {/* Participantes */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Participantes ({participants.length})
                </h3>
              </div>
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {participant.name} {participant.isCurrentUser && "(Tú)"}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {participant.role}
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recursos */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Recursos
                </h3>
              </div>
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                {resources.length > 0 ? (
                  resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        {resource.type === "document" ? (
                          <FileText className="w-5 h-5 text-green-600" />
                        ) : (
                          <LinkIcon className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {resource.name}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {resource.type}
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No hay recursos disponibles</p>
                    <p className="text-xs text-gray-400">
                      Los recursos compartidos aparecerán aquí
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de extensión de sesión */}
        {showExtendModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="text-center">
                <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Tiempo de Sesión Expirado
                </h3>
                <p className="text-gray-600 mb-6">
                  La sesión ha superado su tiempo programado. ¿Quieres extender
                  la sesión?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowExtendModal(false);
                      if (isOrganizer) {
                        setShowEndSessionModal(true);
                      } else {
                        // Participante regular sale de la sesión
                        leaveSessionAsParticipant();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {isOrganizer ? "Terminar Sesión" : "Salir"}
                  </button>
                  <button
                    onClick={() => extendSession(30)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Extender 30 min
                  </button>
                </div>
                <button
                  onClick={() => extendSession(60)}
                  className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Extender 1 hora
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para terminar sesión */}
        {showEndSessionModal && isOrganizer && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Terminar Sesión
                </h3>
                <p className="text-gray-600 mb-6">
                  ¿Estás seguro de que quieres terminar esta sesión? Todos los
                  participantes serán desconectados.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEndSessionModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      await endSession();
                      setShowEndSessionModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Terminar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Feedback de Sesión */}
        <SessionFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            onLeaveSession();
          }}
          sessionData={{
            id: session?.sessionData?.id || session?.id,
            title: session?.title || session?.sessionData?.title,
            duration: session?.duration || session?.sessionData?.duration || 60,
            group:
              session?.groups?.name ||
              session?.sessionData?.groups?.name ||
              "Grupo",
            type: session?.type || session?.sessionData?.type || "study",
          }}
          onSubmitFeedback={handleFeedbackSubmit}
        />
      </div>
    );
  };
};

export default ActiveSessionSection;
