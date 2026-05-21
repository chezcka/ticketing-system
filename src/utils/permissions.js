export const ROLES = {
  CLIENT: 'CLIENT',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  ADMIN: 'ADMIN',
};
 
export const hasRole = (userRole, requiredRoles) => {
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }
  return userRole === requiredRoles;
};
 
export const canViewTicket = (userRole, ticketCreator, ticketAssignee, userId) => {
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.CLIENT) return ticketCreator === userId;
  if (userRole === ROLES.SUPPORT_AGENT) return ticketAssignee === userId;
  return false;
};
 
export const canEditTicket = (userRole, ticketCreator, ticketAssignee, userId) => {
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.SUPPORT_AGENT) return ticketAssignee === userId;
  return false;
};
 
export const canAssignTicket = (userRole) => {
  return userRole === ROLES.ADMIN || userRole === ROLES.SUPPORT_AGENT;
};
 
export const canViewAnalytics = (userRole) => {
  return userRole === ROLES.ADMIN;
};
 
export const canManageUsers = (userRole) => {
  return userRole === ROLES.ADMIN;
};