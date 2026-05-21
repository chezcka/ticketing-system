import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { useToast } from '../context/ToastContext';
import * as ticketService from '../services/ticketService';
import Alert from '../components/Common/Alert';
import './CreateTicketPage.css';
 
export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { success, error: errorToast } = useToast();
 
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
  });
 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }
 
    try {
      setLoading(true);
      await ticketService.createTicket(formData);
      success('Ticket created successfully!');
      setTimeout(() => navigate('/tickets'), 1000);
    } catch (err) {
      const msg = err.message || 'Failed to create ticket';
      setError(msg);
      errorToast(msg);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <MainLayout>
      <div className="create-ticket-page">
        <h1>Create New Ticket</h1>
 
        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}
 
        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief description of your issue"
              disabled={loading}
              required
            />
          </div>
 
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide detailed information about your issue"
              rows={6}
              disabled={loading}
              required
            />
          </div>
 
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
 
          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
            <button 
              type="button"
              onClick={() => navigate('/tickets')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}