import api from './api';
 
export const getAllTickets = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.priority) {
      params.append('priority', filters.priority);
    }
    if (filters.assignedTo) {
      params.append('assignedTo', filters.assignedTo);
    }
    
    const queryString = params.toString();
    const url = queryString ? `/tickets?${queryString}` : '/tickets';
    
    const response = await api.get(url);
    console.log('🔵 getAllTickets response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching tickets:', error);
    throw error;
  }
};
 
export const getUserTickets = async (page = 0, size = 1000) => {
  try {
    const response = await api.get(`/tickets/user/mine?page=${page}&size=${size}`);
    console.log('getUserTickets response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    throw error;
  }
};
 
export const getAssignedTickets = async (page = 0, size = 10) => {
  try {
    const response = await api.get(`/tickets/assigned/me?page=${page}&size=${size}`);
    console.log('getAssignedTickets response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching assigned tickets:', error);
    throw error;
  }
};
 
export const getTicketById = async (id) => {
  try {
    const response = await api.get(`/tickets/${id}`);
    console.log('getTicketById response:', response.data);
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
};
 
export const createTicket = async (ticketData) => {
  try {
    const response = await api.post('/tickets', ticketData);
    console.log('createTicket response:', response.data);
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};
 
export const updateTicket = async (id, ticketData) => {
  try {
    const response = await api.put(`/tickets/${id}`, ticketData);
    console.log('updateTicket response:', response.data);
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};
 
export const updateTicketStatus = async (id, status) => {
  try {
    const response = await api.patch(`/tickets/${id}/status`, { status });
    console.log('updateTicketStatus response:', response.data);
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
};
 
export const reassignTicket = async (ticketId, agentId) => {
  try {
    const response = await api.patch(`/tickets/${ticketId}/reassign`, {
      agentId,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Failed to reassign ticket'
    );
  }
};
 
export const resolveTicket = async (id) => {
  try {
    const response = await api.patch(`/tickets/${id}/resolve`);
    console.log('resolveTicket response:', response.data);
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('Error resolving ticket:', error);
    throw error;
  }
};
 
export const closeTicket = async (id) => {
  try {
    const response = await api.patch(`/tickets/${id}/close`);
    console.log('closeTicket response:', response.data);
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('Error closing ticket:', error);
    throw error;
  }
};
 
export const deleteTicket = async (id) => {
  try {
    await api.delete(`/tickets/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
};
 
export const getTicketStats = async () => {
  try {
    const response = await api.get('/tickets/stats');
    console.log('getTicketStats response:', response.data);
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    throw error;
  }
};