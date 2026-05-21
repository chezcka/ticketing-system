export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return date.toLocaleDateString('en-US', options);
};
 
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return date.toLocaleDateString('en-US', options);
};
 
export const getStatusLabel = (status) => {
  const labels = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };
  return labels[status] || status;
};
 
export const getStatusColor = (status) => {
  const colors = {
    OPEN: '#ef4444',
    IN_PROGRESS: '#f59e0b',
    RESOLVED: '#10b981',
    CLOSED: '#6b7280',
  };
  return colors[status] || '#9ca3af';
};
 
export const getPriorityLabel = (priority) => {
  const labels = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
  };
  return labels[priority] || priority;
};
 
export const getPriorityColor = (priority) => {
  const colors = {
    LOW: '#22c55e',
    MEDIUM: '#eab308',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  };
  return colors[priority] || '#9ca3af';
};
 
export const getRoleLabel = (role) => {
  const labels = {
    CLIENT: 'Client',
    SUPPORT_AGENT: 'Support Agent',
    ADMIN: 'Administrator',
  };
  return labels[role] || role;
};