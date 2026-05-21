import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MainLayout from './MainLayout';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import Badge from '../components/Common/Badge';
import { formatDateTime, getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '../utils/formatters';
import * as ticketService from '../services/ticketService';
import * as commentService from '../services/commentService';
import './TicketDetailPage.css';
 
export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: errorToast } = useToast();
 
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
 
  useEffect(() => {
    loadTicket();
    loadComments();
  }, [id]);
 
  const loadTicket = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await ticketService.getTicketById(id);
      setTicket(data);
    } catch (err) {
      const message = 'Failed to load ticket';
      setError(message);
      errorToast(message);
    } finally {
      setIsLoading(false);
    }
  };
 
  const loadComments = async () => {
    try {
      const data = await commentService.getCommentsByTicket(id);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };
 
  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      await ticketService.updateTicketStatus(id, newStatus);
      setTicket({ ...ticket, status: newStatus });
      success('Ticket status updated!');
      setSuccessMessage('Ticket status updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      errorToast('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };
 
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
 
    setCommentLoading(true);
    try {
      const newComment = await commentService.addComment(id, commentText, isInternal);
      setComments([...comments, newComment]);
      setCommentText('');
      setIsInternal(false);
      success('Comment added!');
    } catch (err) {
      errorToast('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };
 
  if (isLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading ticket..." />
      </MainLayout>
    );
  }
 
  if (error || !ticket) {
    return (
      <MainLayout>
        <Alert type="error" message={error || 'Ticket not found'} />
      </MainLayout>
    );
  }
 
  return (
    <MainLayout>
      <div className="ticket-detail">
        <div className="ticket-header">
          <Link to="/tickets" className="back-link">← Back to Tickets</Link>
          <h1 className="ticket-title">{ticket.title}</h1>
          <p className="ticket-id">Ticket #{ticket.id}</p>
        </div>
 
        {successMessage && (
          <Alert 
            type="success" 
            message={successMessage}
            onClose={() => setSuccessMessage('')}
          />
        )}
 
        <div className="ticket-content">
          {/* Main Content */}
          <div className="ticket-main">
            {/* Description */}
            <div className="ticket-section">
              <h3>Description</h3>
              <p className="ticket-description">{ticket.description}</p>
            </div>
 
            {/* Comments */}
            <div className="comments-section">
              <h3>Comments & Updates</h3>
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="no-comments">No comments yet</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-header">
                        <strong>{comment.authorName}</strong>
                        {comment.isInternal && (
                          <Badge type="purple">Internal</Badge>
                        )}
                        <span className="comment-date">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="comment-text">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
 
              {/* Add Comment */}
              {user && (user.role === 'SUPPORT_AGENT' || user.id === ticket.createdBy) && (
                <form className="comment-form" onSubmit={handleAddComment}>
                  <div className="form-group">
                    <label htmlFor="comment">Add Comment</label>
                    <textarea
                      id="comment"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Type your comment here..."
                      rows={4}
                      disabled={commentLoading}
                    />
                  </div>
 
                  {user.role === 'SUPPORT_AGENT' && (
                    <div className="form-group checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          disabled={commentLoading}
                        />
                        <span>Internal Note (visible to agents only)</span>
                      </label>
                    </div>
                  )}
 
                  <button 
                    type="submit" 
                    disabled={commentLoading || !commentText.trim()}
                    className="btn-primary"
                  >
                    {commentLoading ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              )}
            </div>
          </div>
 
          {/* Sidebar */}
          <div className="ticket-sidebar">
            {/* Status */}
            <div className="info-card">
              <label>Status</label>
              {user?.role === 'SUPPORT_AGENT' || user?.role === 'ADMIN' ? (
                <select 
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={statusLoading}
                  className="status-select"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              ) : (
                <p>{getStatusLabel(ticket.status)}</p>
              )}
            </div>
 
            {/* Priority */}
            <div className="info-card">
              <label>Priority</label>
              <Badge type={ticket.priority.toLowerCase()}>
                {getPriorityLabel(ticket.priority)}
              </Badge>
            </div>
 
            {/* Created */}
            <div className="info-card">
              <label>Created</label>
              <p>{formatDateTime(ticket.createdAt)}</p>
            </div>
 
            {/* Updated */}
            <div className="info-card">
              <label>Last Updated</label>
              <p>{formatDateTime(ticket.updatedAt)}</p>
            </div>
 
            {/* Assigned To */}
            {ticket.assignedTo && (
              <div className="info-card">
                <label>Assigned To</label>
                <p>{ticket.assignedTo.name || 'Unassigned'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}