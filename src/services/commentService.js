import api from './api';

export const getCommentsByTicket = async (ticketId) => {
  try {
    const response = await api.get(`/tickets/${ticketId}/comments`);
    console.log('getCommentsByTicket response:', response.data);

    // response.data = { data: [...], success: true, message: '...' }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const addComment = async (ticketId, content, isInternal = false) => {
  try {
    const response = await api.post(`/tickets/${ticketId}/comments`, {
      content,
      isInternal,
    });
    console.log('addComment response:', response.data);

    // response.data = { data: { id, ... }, success: true }
    if (response.data?.data) return response.data.data;
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const updateComment = async (commentId, content) => {
  try {
    const response = await api.put(`/tickets/comments/${commentId}`, { content });
    if (response.data?.data) return response.data.data;
    return response.data;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId) => {
  try {
    await api.delete(`/tickets/comments/${commentId}`);
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};