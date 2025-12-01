import React, { useState, useEffect } from 'react';
import { X, Heart, MessageSquare, Send, Plus, User, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForums } from '../../../hooks/useForums';
import CreatePostModal from '../events/CreatePostModal';
import Avatar from '../../ui/Avatar';

const ForumDetailsModal = ({ isOpen, onClose, forum, user, onPostCreated }) => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const { getForumPosts, getPost, createReply, likePost, loading } = useForums();

  useEffect(() => {
    if (isOpen && forum) {
      loadPosts();
    }
  }, [isOpen, forum]);

  const loadPosts = async () => {
    try {
      const response = await getForumPosts(forum.id);
      if (response?.data?.posts) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      // Error loading posts
    }
  };

  const handlePostClick = async (post) => {
    try {
      const response = await getPost(post.id);
      if (response?.data?.post && response?.data?.replies) {
        // Combinar post con respuestas
        setSelectedPost({
          ...response.data.post,
          replies: response.data.replies
        });
      } else if (response?.data?.post) {
        setSelectedPost(response.data.post);
      }
    } catch (error) {
      // Error loading post
    }
  };

  const handleReply = async (postId) => {
    if (!replyContent.trim()) return;

    try {
      await createReply(postId, { content: replyContent });
      setReplyContent('');
      setReplyingTo(null);
      if (selectedPost) {
        handlePostClick(selectedPost);
      }
      loadPosts();
    } catch (error) {
      // Error creating reply
    }
  };

  const handleLike = async (postId, e) => {
    if (e) {
      e.stopPropagation(); // Prevenir que se active el click del post
    }
    try {
      const response = await likePost(postId);
      // Actualizar el post localmente sin recargar completo (para no incrementar vistas)
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          likes: response?.data?.likes ?? selectedPost.likes
        });
      }
      // Recargar lista de posts para actualizar el contador
      loadPosts();
    } catch (error) {
      // Error liking post
    }
  };

  const handlePostCreated = () => {
    setShowCreatePostModal(false);
    loadPosts();
    if (onPostCreated) {
      onPostCreated();
    }
  };

  if (!isOpen || !forum) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full overflow-hidden max-h-[90vh] flex flex-col"
        >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{forum.title}</h2>
              {forum.description && (
                <p className="text-white/80 mt-1">{forum.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedPost ? (
            // Vista de post detallado
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Avatar
                      userId={selectedPost.author?.id || selectedPost.author?.email || 'author'}
                      name={selectedPost.author?.name || 'Autor'}
                      avatar={selectedPost.author?.avatar_url || null}
                      avatarStyle={selectedPost.author?.avatar}
                      size={12}
                      showBorder={false}
                      className="bg-blue-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {selectedPost.author?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedPost.author?.university}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(selectedPost.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {selectedPost.title}
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
                <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
                  <button
                    onClick={(e) => handleLike(selectedPost.id, e)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <Heart className="w-5 h-5" />
                    <span>{selectedPost.likes || 0}</span>
                  </button>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MessageSquare className="w-5 h-5" />
                    <span>{selectedPost.replies_count || 0} respuestas</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span>{selectedPost.views || 0} vistas</span>
                  </div>
                </div>
              </div>

              {/* Respuestas */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  Respuestas ({selectedPost.replies?.length || 0})
                </h4>
                <div className="space-y-4">
                  {selectedPost.replies && selectedPost.replies.length > 0 ? (
                    selectedPost.replies.map((reply) => (
                      <div key={reply.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <Avatar
                            userId={reply.author?.id || reply.author?.email || `reply-${reply.id}`}
                            name={reply.author?.name || 'Usuario'}
                            avatar={reply.author?.avatar_url || null}
                            avatarStyle={reply.author?.avatar}
                            size={12}
                            showBorder={false}
                            className="bg-gray-100 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="font-medium text-gray-900 text-sm">
                                {reply.author?.name}
                              </p>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.created_at).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <p className="text-gray-700">{reply.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>No hay respuestas aún. Sé el primero en responder.</p>
                    </div>
                  )}
                </div>

                {/* Formulario de respuesta */}
                {replyingTo === selectedPost.id && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleReply(selectedPost.id)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4" />
                        <span>Enviar</span>
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {!replyingTo && !forum.is_locked && forum.allow_replies && (
                  <button
                    onClick={() => setReplyingTo(selectedPost.id)}
                    className="mt-4 flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Responder</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedPost(null)}
                className="text-blue-600 hover:text-blue-700"
              >
                ← Volver a la lista de posts
              </button>
            </div>
          ) : (
            // Lista de posts
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Posts ({posts.length})
                </h3>
                {!forum.is_locked && forum.allow_replies && (
                  <button
                    onClick={() => setShowCreatePostModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Post</span>
                  </button>
                )}
              </div>

              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No hay posts en este foro aún</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post)}
                    className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Avatar
                          userId={post.author?.id || post.author?.email || `post-${post.id}`}
                          name={post.author?.name || 'Autor'}
                          avatar={post.author?.avatar_url || null}
                          avatarStyle={post.author?.avatar}
                          size={12}
                          showBorder={false}
                          className="bg-blue-100 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {post.author?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(post.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      {post.is_pinned && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Fijado
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h4>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {post.content}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post.id, e);
                        }}
                        className="flex items-center space-x-1 hover:text-red-500"
                      >
                        <Heart className="w-4 h-4" />
                        <span>{post.likes || 0}</span>
                      </button>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.replies_count || 0}</span>
                      </div>
                      <span>{post.views || 0} vistas</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modales */}
        {showCreatePostModal && (
          <CreatePostModal
            isOpen={showCreatePostModal}
            onClose={() => setShowCreatePostModal(false)}
            onPostCreated={handlePostCreated}
            forumId={forum.id}
          />
        )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ForumDetailsModal;

