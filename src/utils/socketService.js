import io from 'socket.io-client';
import { getToken } from './localStorage';
 
let socket = null;
 
export const initSocket = () => {
  if (socket?.connected) return socket;
 
  const token = getToken();
  
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080', {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });
 
  socket.on('connect', () => {
    console.log('✅ WebSocket connected:', socket.id);
  });
 
  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
  });
 
  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected');
  });
 
  return socket;
};
 
export const getSocket = () => {
  if (!socket) {
    initSocket();
  }
  return socket;
};
 
export const subscribeToTicket = (ticketId, callback) => {
  const socket = getSocket();
  
  socket.emit('subscribe:ticket', ticketId);
  socket.on(`ticket:${ticketId}:updated`, callback);
  
  return () => {
    socket.emit('unsubscribe:ticket', ticketId);
    socket.off(`ticket:${ticketId}:updated`);
  };
};
 
export const subscribeToComment = (ticketId, callback) => {
  const socket = getSocket();
  
  socket.on(`ticket:${ticketId}:comment-added`, callback);
  
  return () => {
    socket.off(`ticket:${ticketId}:comment-added`);
  };
};
 
export const subscribeToDashboard = (callback) => {
  const socket = getSocket();
  
  socket.emit('subscribe:dashboard');
  socket.on('dashboard:update', callback);
  
  return () => {
    socket.off('dashboard:update');
  };
};