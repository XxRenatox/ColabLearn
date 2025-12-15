import React, { useRef, useEffect, useState } from 'react';
import { Send, Loader, Wifi, WifiOff, MoreVertical, Edit, Trash2, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmModal from '../../../modals/ConfirmModal';

const ChatUI = ({
    title,
    subtitle,
    isConnected = true,
    isConnecting = false,
    messages = [],
    currentUserId,
    onSendMessage,
    isSending = false,
    placeholder = "Escribe un mensaje...",
    emptyStateMessage = "No hay mensajes aún",
    emptyStateSubmessage = "¡Escribe el primero!",
    // Callbacks de acciones (opcionales)
    onEditMessage,
    onDeleteMessage,
    onReportMessage,
    // Roles y permisos (opcional)
    userRole,
    // Paginación
    onLoadMore,
    hiddenCount = 0,
}) => {
    const [newMessage, setNewMessage] = useState('');
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const [showMenuMessageId, setShowMenuMessageId] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // Modales
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [showReportConfirm, setShowReportConfirm] = useState(false);
    const [messageToReport, setMessageToReport] = useState(null);

    const messagesContainerRef = useRef(null);
    const chatEndRef = useRef(null);

    // Scroll al fondo al cambiar mensajes
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages.length]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (!newMessage.trim() || isSending) return;
        onSendMessage(newMessage);
        setNewMessage('');
    };

    /* --- Handlers de Edición/Eliminación --- */
    const startEdit = (msg) => {
        setEditingMessageId(msg.id);
        setEditContent(msg.content);
        setShowMenuMessageId(null);
    };

    const saveEdit = () => {
        if (onEditMessage && editContent.trim()) {
            onEditMessage(editingMessageId, editContent);
        }
        setEditingMessageId(null);
        setEditContent('');
    };

    const requestDelete = (msgId) => {
        setMessageToDelete(msgId);
        setShowDeleteConfirm(true);
        setShowMenuMessageId(null);
    };

    const confirmDelete = () => {
        if (onDeleteMessage && messageToDelete) {
            onDeleteMessage(messageToDelete);
        }
        setShowDeleteConfirm(false);
        setMessageToDelete(null);
    };

    const requestReport = (msgId) => {
        setMessageToReport(msgId);
        setShowReportConfirm(true);
        setShowMenuMessageId(null);
    };

    const confirmReport = () => {
        if (onReportMessage && messageToReport) {
            onReportMessage(messageToReport);
        }
        setShowReportConfirm(false);
        setMessageToReport(null);
    };

    /* --- Render Helpers --- */
    const getRoleBadge = (role) => {
        if (role === 'admin') return <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white">ADMIN</span>;
        if (role === 'moderator') return <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white">MOD</span>;
        return null;
    };

    if (!isConnected && !isConnecting) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-gray-600 bg-gray-50 rounded-lg">
                <WifiOff className="w-12 h-12 text-red-500 mb-3" />
                <h3 className="text-lg font-semibold">Desconectado</h3>
                <p className="text-sm">Revisa tu conexión</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm z-10">
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-800 truncate">{title}</h3>
                    {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
                </div>
                <div className="flex items-center text-xs text-gray-500 ml-2">
                    {isConnected ? (
                        <Wifi className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                        <WifiOff className="w-3 h-3 text-red-500 mr-1" />
                    )}
                </div>
            </div>

            {/* Messages List */}
            <div
                ref={messagesContainerRef}
                className="flex-1 px-4 py-3 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            >
                {/* Botón Cargar Más (Si hay ocultos) */}
                {hiddenCount > 0 && onLoadMore && (
                    <div className="flex justify-center mb-4">
                        <button
                            onClick={onLoadMore}
                            className="rounded-full bg-white px-3 sm:px-4 py-1.5 text-xs font-medium text-blue-600 shadow-sm border border-blue-200 transition hover:bg-blue-50"
                        >
                            Ver {hiddenCount} mensajes anteriores
                        </button>
                    </div>
                )}

                {messages.length > 0 ? (
                    messages.map((msg, index) => {
                        const isOwn = msg.sender?.isCurrentUser || msg.sender?.id === currentUserId || msg.isOwn;
                        const prev = messages[index - 1];
                        // Agrupar si el anterior es del mismo usuario y pasó menos de 5 min
                        const isGrouped = prev && (prev.sender?.id === msg.sender?.id || (isOwn && prev.isOwn)) && (msg.timestamp - prev.timestamp < 5 * 60 * 1000);

                        const showName = !isOwn && !isGrouped;
                        const messageId = msg.id || index;
                        const isHovered = hoveredMessageId === messageId;
                        const isEditing = editingMessageId === messageId;
                        const showMenu = showMenuMessageId === messageId;

                        // Permisos simples: Editar solo si es propio. (El padre puede controlar más con los callbacks)
                        const canEdit = isOwn && onEditMessage;
                        const canDelete = isOwn && onDeleteMessage; // O admin, manejado por padre si pasa flag

                        return (
                            <div
                                key={messageId}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative`}
                                onMouseEnter={() => setHoveredMessageId(messageId)}
                                onMouseLeave={() => {
                                    setHoveredMessageId(null);
                                    if (!showMenu) setShowMenuMessageId(null);
                                }}
                            >
                                <div className={`max-w-[85%] sm:max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {showName && (
                                        <div className="flex items-center gap-1 mb-1 px-1">
                                            <span className="text-xs font-semibold text-gray-600">
                                                {msg.sender?.name || "Usuario"}
                                            </span>
                                            {getRoleBadge(msg.sender?.role)}
                                        </div>
                                    )}

                                    <div
                                        className={`relative px-3 py-2 rounded-lg shadow-sm text-sm break-words ${isOwn
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                                            }`}
                                    >
                                        {isEditing ? (
                                            <div className="min-w-[200px]">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full p-2 text-gray-800 rounded bg-blue-50 text-sm focus:outline-none resize-none"
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button onClick={() => setEditingMessageId(null)} className="text-xs underline opacity-80">Cancelar</button>
                                                    <button onClick={saveEdit} className="text-xs bg-white text-blue-600 px-2 py-1 rounded font-bold">Guardar</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    <span className="text-[10px]">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {msg.isEdited && <span className="text-[10px] italic">(editado)</span>}
                                                </div>
                                            </>
                                        )}

                                        {/* Botón Menú (Solo hover y no editando) */}
                                        {isHovered && !isEditing && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMenuMessageId(showMenu ? null : messageId);
                                                }}
                                                className={`absolute top-0 ${isOwn ? '-left-8' : '-right-8'} p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity`}
                                            >
                                                <MoreVertical size={14} />
                                            </button>
                                        )}

                                        {/* Dropdown Menú */}
                                        {showMenu && !isEditing && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`absolute top-full ${isOwn ? 'right-0' : 'left-0'} mt-1 bg-white rounded-md shadow-lg border border-gray-100 z-20 overflow-hidden min-w-[120px]`}
                                            >
                                                {canEdit && (
                                                    <button onClick={() => startEdit(msg)} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 text-gray-700">
                                                        <Edit size={12} /> Editar
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button onClick={() => requestDelete(msg.id)} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-red-50 text-red-600">
                                                        <Trash2 size={12} /> Eliminar
                                                    </button>
                                                )}
                                                {!isOwn && onReportMessage && (
                                                    <button onClick={() => requestReport(msg.id)} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-orange-50 text-orange-600">
                                                        <Flag size={12} /> Reportar
                                                    </button>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                        <span className="text-4xl mb-2">💬</span>
                        <p className="text-sm font-medium">{emptyStateMessage}</p>
                        <p className="text-xs">{emptyStateSubmessage}</p>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={!isConnected || isSending}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all disabled:opacity-50"
                />
                <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || !isConnected || isSending}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    {isSending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Eliminar mensaje"
                message="¿Estás seguro? Esta acción es irreversible."
                confirmText="Eliminar"
                type="danger"
            />
            <ConfirmModal
                isOpen={showReportConfirm}
                onClose={() => setShowReportConfirm(false)}
                onConfirm={confirmReport}
                title="Reportar mensaje"
                message="¿Quieres reportar este mensaje a los moderadores?"
                confirmText="Reportar"
                type="warning"
            />
        </div>
    );
};

export default ChatUI;