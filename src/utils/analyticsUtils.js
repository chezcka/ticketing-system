/**
 * analyticsUtils.js
 * Shared utility functions for calculating real-time analytics metrics
 * Used by both AdminDashboard and AnalyticsPage
 */

/**
 * Calculate average resolution time from actual ticket data
 * @param {Array} tickets - Array of ticket objects
 * @returns {number} Average hours to resolve tickets
 */
export const calculateAvgResolutionTime = (tickets) => {
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED');
  
  if (resolvedTickets.length === 0) return 0;
  
  // If backend provides resolvedAt timestamp, use it
  const withTimestamps = resolvedTickets.filter(t => t.resolvedAt);
  
  if (withTimestamps.length > 0) {
    const totalHours = withTimestamps.reduce((sum, ticket) => {
      const created = new Date(ticket.createdAt);
      const resolved = new Date(ticket.resolvedAt);
      const diffMs = resolved - created;
      const diffHours = diffMs / (1000 * 60 * 60);
      return sum + diffHours;
    }, 0);
    
    return Math.round(totalHours / withTimestamps.length);
  }
  
  // Fallback: estimate based on time since creation (rough approximation)
  const totalHours = resolvedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffHours = diffMs / (1000 * 60 * 60);
    return sum + Math.min(diffHours, 168); // Cap at 1 week for estimates
  }, 0);
  
  return Math.round(totalHours / resolvedTickets.length);
};

/**
 * Calculate average first response time
 * @param {Array} tickets - Array of ticket objects
 * @returns {number} Average minutes for first response
 */
export const calculateAvgFirstResponseTime = (tickets) => {
  const assignedTickets = tickets.filter(t => t.assignedTo && t.updatedAt);
  
  if (assignedTickets.length === 0) return 0;
  
  const totalMinutes = assignedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.createdAt);
    const updated = new Date(ticket.updatedAt);
    const diffMs = updated - created;
    const diffMinutes = diffMs / (1000 * 60);
    return sum + Math.min(diffMinutes, 120); // Cap at 2 hours
  }, 0);
  
  return Math.round(totalMinutes / assignedTickets.length);
};

/**
 * Calculate customer satisfaction score based on metrics
 * @param {Array} tickets - Array of ticket objects
 * @returns {number} Satisfaction percentage (0-100)
 */
export const calculateSatisfactionScore = (tickets) => {
  if (tickets.length === 0) return 0;
  
  const resolved = tickets.filter(t => t.status === 'RESOLVED').length;
  const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const open = tickets.filter(t => t.status === 'OPEN').length;
  
  // Calculate resolution rate
  const resolutionRate = (resolved / tickets.length) * 100;
  
  // Calculate response rate (assigned + resolved are responded to)
  const responded = (resolved + inProgress) / tickets.length;
  
  // Satisfaction = 50% base + (resolution_rate * 0.35) + (response_rate * 0.15)
  // Max: 50 + 35 + 15 = 100%
  // Min: 50% (even with 0 resolution)
  const satisfaction = 50 + (resolutionRate * 0.35) + (responded * 0.15 * 100);
  
  return Math.round(Math.min(satisfaction, 100)); // Cap at 100%
};

/**
 * Calculate agent utilization percentage
 * @param {Array} tickets - Array of ticket objects
 * @returns {number} Utilization percentage (0-100)
 */
export const calculateAgentUtilization = (tickets) => {
  if (tickets.length === 0) return 0;
  
  const assigned = tickets.filter(t => t.assignedTo).length;
  return Math.floor((assigned / tickets.length) * 100);
};

/**
 * Calculate resolution rate percentage
 * @param {Array} tickets - Array of ticket objects
 * @returns {number} Resolution rate percentage (0-100)
 */
export const calculateResolutionRate = (tickets) => {
  if (tickets.length === 0) return 0;
  
  const resolved = tickets.filter(t => t.status === 'RESOLVED').length;
  return Math.floor((resolved / tickets.length) * 100);
};

/**
 * Calculate open tickets percentage
 * @param {Array} tickets - Array of ticket objects
 * @returns {number} Open percentage (0-100)
 */
export const calculateOpenPercentage = (tickets) => {
  if (tickets.length === 0) return 0;
  
  const open = tickets.filter(t => t.status === 'OPEN').length;
  return Math.floor((open / tickets.length) * 100);
};

/**
 * Get all analytics at once
 * @param {Array} tickets - Array of ticket objects
 * @returns {Object} All metrics calculated
 */
export const calculateAllAnalytics = (tickets) => {
  return {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    unassigned: tickets.filter(t => !t.assignedTo).length,
    assigned: tickets.filter(t => t.assignedTo).length,
    avgResolutionTime: calculateAvgResolutionTime(tickets),
    satisfaction: calculateSatisfactionScore(tickets),
    agentUtilization: calculateAgentUtilization(tickets),
    firstResponseTime: calculateAvgFirstResponseTime(tickets),
    openPercentage: calculateOpenPercentage(tickets),
    resolutionRate: calculateResolutionRate(tickets),
  };
};

export default {
  calculateAvgResolutionTime,
  calculateAvgFirstResponseTime,
  calculateSatisfactionScore,
  calculateAgentUtilization,
  calculateResolutionRate,
  calculateOpenPercentage,
  calculateAllAnalytics,
};