import { useState, useCallback } from 'react';
import { forumsAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';

export const useForums = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const getForums = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await forumsAPI.getForums(params);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error obteniendo foros';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const getForum = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await forumsAPI.getForum(id);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error obteniendo foro';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const createForum = useCallback(async (forumData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await forumsAPI.createForum(forumData);
      addToast?.('Foro creado exitosamente', 'success');
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error creando foro';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const updateForum = useCallback(async (id, forumData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await forumsAPI.updateForum(id, forumData);
      addToast?.('Foro actualizado exitosamente', 'success');
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error actualizando foro';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const deleteForum = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      await forumsAPI.deleteForum(id);
      addToast?.('Foro eliminado exitosamente', 'success');
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error eliminando foro';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const getForumPosts = useCallback(async (forumId, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await forumsAPI.getForumPosts(forumId, params);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error obteniendo posts';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const getPost = useCallback(async (postId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await forumsAPI.getPost(postId);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error obteniendo post';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const createPost = useCallback(async (forumId, postData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await forumsAPI.createPost(forumId, postData);
      addToast?.('Post creado exitosamente', 'success');
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error creando post';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const createReply = useCallback(async (postId, replyData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await forumsAPI.createReply(postId, replyData);
      addToast?.('Respuesta publicada exitosamente', 'success');
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error publicando respuesta';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const likePost = useCallback(async (postId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await forumsAPI.likePost(postId);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error dando like';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  return {
    loading,
    error,
    getForums,
    getForum,
    createForum,
    updateForum,
    deleteForum,
    getForumPosts,
    getPost,
    createPost,
    createReply,
    likePost
  };
};

export default useForums;

