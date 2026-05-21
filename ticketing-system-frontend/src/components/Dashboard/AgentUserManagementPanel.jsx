import React, { useEffect, useState } from 'react';
import './AgentUserManagementPanel.css';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"/>
  </svg>
);

const IconAlertCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

const AgentUserManagementPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const api = (await import('../../services/api')).default;
      const response = await api.get('/auth/users');

      if (response.data && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      } else if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      setErrorMessage('Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.email || !formData.password || !formData.fullName) {
      setErrorMessage('All fields are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    try {
      setCreating(true);
      const api = (await import('../../services/api')).default;
      const response = await api.post('/auth/register-agent', {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: 'SUPPORT_AGENT'
      });

      setSuccessMessage(`Support agent "${formData.fullName}" created successfully!`);
      setFormData({ email: '', password: '', fullName: '' });
      setShowCreateForm(false);
      await fetchUsers();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to create agent. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SUPPORT_AGENT': return 'aump__role-badge--agent';
      case 'ADMIN':         return 'aump__role-badge--admin';
      case 'CLIENT':        return 'aump__role-badge--client';
      default:              return 'aump__role-badge--default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'SUPPORT_AGENT': return 'Support Agent';
      case 'ADMIN':         return 'Administrator';
      case 'CLIENT':        return 'Client';
      default:              return role.replace(/_/g, ' ');
    }
  };

  return (
    <div className="aump">
      {/* ── Header ── */}
      <div className="aump__header">
        <div className="aump__header-left">
          <IconUsers />
          <h2 className="aump__title">User Management</h2>
        </div>
        <button
          className="aump__btn-create"
          onClick={() => setShowCreateForm(!showCreateForm)}
          title={showCreateForm ? 'Close form' : 'Create new support agent'}
        >
          <IconPlus />
          New Agent
        </button>
      </div>

      {/* ── Success Message ── */}
      {successMessage && (
        <div className="aump__message aump__message--success">
          <IconCheck />
          {successMessage}
        </div>
      )}

      {/* ── Error Message ── */}
      {errorMessage && (
        <div className="aump__message aump__message--error">
          <IconAlertCircle />
          {errorMessage}
        </div>
      )}

      {/* ── Create Form ── */}
      {showCreateForm && (
        <div className="aump__create-form">
          <h3 className="aump__form-title">Create New Support Agent</h3>
          <form onSubmit={handleCreateAgent} className="aump__form">
            <div className="aump__form-row">
              <div className="aump__field">
                <label className="aump__label">Full Name <span className="aump__req">*</span></label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g., John Doe"
                  className="aump__input"
                  disabled={creating}
                  required
                />
              </div>
              <div className="aump__field">
                <label className="aump__label">Email <span className="aump__req">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="agent@example.com"
                  className="aump__input"
                  disabled={creating}
                  required
                />
              </div>
            </div>

            <div className="aump__field">
              <label className="aump__label">Password <span className="aump__req">*</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Minimum 6 characters"
                className="aump__input"
                disabled={creating}
                minLength="6"
                required
              />
              <p className="aump__hint">Password must be at least 6 characters</p>
            </div>

            <div className="aump__form-actions">
              <button
                type="button"
                className="aump__btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ email: '', password: '', fullName: '' });
                  setErrorMessage('');
                }}
                disabled={creating}
              >
                <IconClose />
                Cancel
              </button>
              <button
                type="submit"
                className="aump__btn-primary"
                disabled={creating}
              >
                {creating ? (
                  'Creating…'
                ) : (
                  <>
                    <IconCheck />
                    Create Agent
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Users List ── */}
      <div className="aump__users-container">
        <div className="aump__users-header">
          <h3 className="aump__subtitle">Registered Users ({users.length})</h3>
          <button
            className="aump__btn-refresh"
            onClick={fetchUsers}
            disabled={loading}
            title="Refresh users list"
          >
            <IconRefresh />
          </button>
        </div>

        {loading ? (
          <div className="aump__loading">
            <span className="aump__spinner" />
            <p>Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="aump__empty">
            <IconUsers />
            <p>No users found</p>
          </div>
        ) : (
          <div className="aump__table-wrap">
            <table className="aump__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="aump__row">
                    <td className="aump__cell-name">
                      <div className="aump__name-wrap">
                        <span className="aump__avatar">{user.fullName?.[0]}</span>
                        <span>{user.fullName}</span>
                      </div>
                    </td>
                    <td className="aump__cell-email">{user.email}</td>
                    <td className="aump__cell-role">
                      <span className={`aump__role-badge ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentUserManagementPanel;