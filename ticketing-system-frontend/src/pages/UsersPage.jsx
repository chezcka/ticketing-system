import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { Navigate } from 'react-router-dom';
import {
  getAllUsers,
  createUser,
  updateUserProfile,
  deleteUser,
  deactivateUser,
  reactivateUser
} from '../services/userService';
import MainLayout from '../pages/MainLayout';
import Pagination from '../components/Common/Pagination';
import './UsersPage.css';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconCheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <path d="m9 11 3 3L22 4"/>
  </svg>
);
const IconAlertCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconSlash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
);
const IconCheckCircleFill = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

// ─── Default departments (always available) ───────────────────────────────────

const DEFAULT_DEPARTMENTS = [
  'Technical Support',
  'Billing',
  'Account Management',
  'General Support',
  'Sales',
  'IT',
];

const STORAGE_KEY = 'ticketing_departments';

const loadDepartments = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge defaults with saved custom ones, deduplicate
      const merged = [...new Set([...DEFAULT_DEPARTMENTS, ...parsed])];
      return merged;
    }
  } catch {}
  return [...DEFAULT_DEPARTMENTS];
};

const saveDepartments = (departments) => {
  try {
    // Only persist the custom ones (not in DEFAULT_DEPARTMENTS)
    const custom = departments.filter(d => !DEFAULT_DEPARTMENTS.includes(d));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  } catch {}
};

// ─── DepartmentSelect component ───────────────────────────────────────────────

const DepartmentSelect = ({ value, onChange, departments, onAddDepartment }) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleSelectChange = (e) => {
    if (e.target.value === '__add_new__') {
      setShowCustomInput(true);
    } else {
      onChange(e.target.value);
    }
  };

  const handleCustomSubmit = () => {
    const trimmed = customValue.trim();
    if (!trimmed) return;
    onAddDepartment(trimmed);
    onChange(trimmed);
    setCustomValue('');
    setShowCustomInput(false);
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleCustomSubmit(); }
    if (e.key === 'Escape') { setShowCustomInput(false); setCustomValue(''); }
  };

  if (showCustomInput) {
    return (
      <div className="up__dept-custom">
        <input
          type="text"
          className="up__dept-input"
          placeholder="Enter department name…"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={handleCustomKeyDown}
          autoFocus
        />
        <button type="button" className="up__dept-confirm" onClick={handleCustomSubmit}>
          Add
        </button>
        <button
          type="button"
          className="up__dept-cancel"
          onClick={() => { setShowCustomInput(false); setCustomValue(''); }}
        >
          <IconClose />
        </button>
      </div>
    );
  }

  return (
    <div className="up__select-wrap">
      <select value={value} onChange={handleSelectChange}>
        <option value="">— Select department —</option>
        {departments.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
        <option value="__add_new__">＋ Add new department…</option>
      </select>
      <IconChevron />
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const UsersPage = () => {
  const { user, isLoading } = useAuth();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [selectedUser, setSelectedUser]       = useState(null);
  const [message, setMessage]       = useState({ type: '', text: '' });
  const [formData, setFormData]     = useState({
    firstName: '', lastName: '', email: '', role: '', department: '', status: 'ACTIVE',
  });

  // ── Departments state (persisted to localStorage) ──
  const [departments, setDepartments] = useState(loadDepartments);

  const handleAddDepartment = (newDept) => {
    if (departments.includes(newDept)) return;
    const updated = [...departments, newDept];
    setDepartments(updated);
    saveDepartments(updated);
  };

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(10);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="up__loading">
          <span className="up__spinner" />
          <p>Loading…</p>
        </div>
      </MainLayout>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      const allUsers = Array.isArray(response) ? response : (response.data || []);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      showMessage('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const getDisplayName = (userData) => {
    if (userData.fullName && userData.fullName.trim()) return userData.fullName;
    const combined = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
    return combined || userData.email || 'Unknown';
  };

  const getAvatarInitials = (userData) => {
    const name = getDisplayName(userData);
    if (name === userData.email) return userData.email.charAt(0).toUpperCase();
    const parts = name.split(' ');
    if (parts.length >= 2) return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
    return name.substring(0, 2).toUpperCase();
  };

  const getFilteredUsers = () => {
    let filtered = users;
    if (activeTab === 'clients') filtered = filtered.filter(u => u.role === 'CLIENT');
    else if (activeTab === 'agents') filtered = filtered.filter(u => u.role === 'SUPPORT_AGENT');
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        getDisplayName(u).toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const newUser = await createUser({ ...formData, role: 'SUPPORT_AGENT' });
      setUsers([...users, newUser]);
      setShowCreateModal(false);
      setFormData({ firstName: '', lastName: '', email: '', role: '', department: '', status: 'ACTIVE' });
      showMessage('success', `Support agent ${getDisplayName(newUser)} created successfully!`);
    } catch (error) {
      showMessage('error', error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userData) => {
    setSelectedUser(userData);
    setFormData({
      firstName:  userData.firstName  || '',
      lastName:   userData.lastName   || '',
      email:      userData.email      || '',
      role:       userData.role       || '',
      department: userData.department || '',
      status:     userData.status     || 'ACTIVE',
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setLoading(true);
      const updated = await updateUserProfile(selectedUser.id, formData);
      setUsers(users.map(u => (u.id === selectedUser.id ? updated : u)));
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ firstName: '', lastName: '', email: '', role: '', department: '', status: 'ACTIVE' });
      showMessage('success', 'User updated successfully');
    } catch (error) {
      showMessage('error', error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (userData) => {
    const fullName = getDisplayName(userData);
    if (window.confirm(`Are you sure you want to deactivate ${fullName}?`)) {
      try {
        setLoading(true);
        await deactivateUser(userData.id);
        setUsers(users.map(u => (u.id === userData.id ? { ...u, status: 'INACTIVE' } : u)));
        showMessage('success', `${fullName} has been deactivated`);
      } catch (error) {
        showMessage('error', error.message || 'Failed to deactivate user');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReactivateUser = async (userData) => {
    const fullName = getDisplayName(userData);
    if (window.confirm(`Are you sure you want to reactivate ${fullName}?`)) {
      try {
        setLoading(true);
        await reactivateUser(userData.id);
        setUsers(users.map(u => (u.id === userData.id ? { ...u, status: 'ACTIVE' } : u)));
        showMessage('success', `${fullName} has been reactivated`);
      } catch (error) {
        showMessage('error', error.message || 'Failed to reactivate user');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteUser = async (userData) => {
    const fullName = getDisplayName(userData);
    if (window.confirm(`⚠️ PERMANENT DELETE: Are you sure you want to permanently delete ${fullName}? This cannot be undone.`)) {
      try {
        setLoading(true);
        await deleteUser(userData.id);
        setUsers(users.filter(u => u.id !== userData.id));
        showMessage('success', 'User permanently deleted');
      } catch (error) {
        showMessage('error', error.message || 'Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredUsers = getFilteredUsers();
  const clientCount   = users.filter(u => u.role === 'CLIENT').length;
  const agentCount    = users.filter(u => u.role === 'SUPPORT_AGENT').length;

  // ── Paginated slice ──
  const totalItems = filteredUsers.length;
  const pagedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <MainLayout>
      <div className="up">

        {/* ── Toast ── */}
        {message.text && (
          <div className={`up__toast up__toast--${message.type}`}>
            {message.type === 'success' ? <IconCheckCircle /> : <IconAlertCircle />}
            {message.text}
          </div>
        )}

        {/* ── Page Header ── */}
        <header className="up__header">
          <div className="up__header-left">
            <h1 className="up__title">Users Management</h1>
            <p className="up__subtitle">Manage all registered users and support agents</p>
          </div>
          <button className="up__btn-create" onClick={() => setShowCreateModal(true)}>
            <IconPlus /> Add User
          </button>
        </header>

        {/* ── Tabs ── */}
        <div className="up__tabs">
          <button
            className={`up__tab ${activeTab === 'clients' ? 'up__tab--active' : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            <IconUsers /> Clients <span className="up__tab-count">{clientCount}</span>
          </button>
          <button
            className={`up__tab ${activeTab === 'agents' ? 'up__tab--active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            <IconUsers /> Support Agents <span className="up__tab-count">{agentCount}</span>
          </button>
        </div>

        {/* ── Panel ── */}
        <section className="up__panel">
          <div className="up__panel-head">
            <h2 className="up__panel-title">
              {activeTab === 'clients' ? 'Registered Clients' : 'Support Agents'}
              <span className="up__count">{filteredUsers.length}</span>
            </h2>
            <div className="up__search">
              <IconSearch />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="up__loading">
              <span className="up__spinner" /><p>Loading users…</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="up__empty">
              <IconUsers /><p>No users found.</p>
            </div>
          ) : (
            <>
              <div className="up__table-wrap">
                <table className="up__table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      {activeTab === 'agents' && <th>Department</th>}
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map(userData => {
                      const displayName = getDisplayName(userData);
                      const initials    = getAvatarInitials(userData);
                      return (
                        <tr key={userData.id} className="up__row">
                          <td className="up__cell-name">
                            <div className="up__user-avatar">{initials}</div>
                            <div className="up__user-info">
                              <div className="up__user-name">{displayName}</div>
                            </div>
                          </td>
                          <td className="up__cell-email">{userData.email}</td>
                          {activeTab === 'agents' && (
                            <td className="up__cell-department">{userData.department || '—'}</td>
                          )}
                          <td>
                            <span className={`up__badge up__badge--${userData.status?.toLowerCase() || 'active'}`}>
                              {userData.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="up__cell-actions">
                            <button className="up__btn-icon" onClick={() => handleEditUser(userData)} title="Edit user">
                              <IconEdit />
                            </button>
                            {userData.status === 'ACTIVE' ? (
                              <button className="up__btn-icon up__btn-icon--warning" onClick={() => handleDeactivateUser(userData)} title="Deactivate user">
                                <IconSlash />
                              </button>
                            ) : (
                              <button className="up__btn-icon up__btn-icon--success" onClick={() => handleReactivateUser(userData)} title="Reactivate user">
                                <IconCheckCircleFill />
                              </button>
                            )}
                            <button className="up__btn-icon up__btn-icon--danger" onClick={() => handleDeleteUser(userData)} title="Delete user">
                              <IconTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            </>
          )}
        </section>

        {/* ── Create Modal ── */}
        {showCreateModal && (
          <div className="up__overlay" onClick={() => setShowCreateModal(false)}>
            <div className="up__modal" onClick={(e) => e.stopPropagation()}>
              <div className="up__modal-head">
                <div>
                  <h2>Add New Support Agent</h2>
                  <p className="up__modal-sub">Create a new support agent account</p>
                </div>
                <button className="up__modal-close" onClick={() => setShowCreateModal(false)}><IconClose /></button>
              </div>
              <form onSubmit={handleCreateUser} className="up__form">
                <div className="up__form-row">
                  <div className="up__field">
                    <label>First Name <span className="up__req">*</span></label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="John" required />
                  </div>
                  <div className="up__field">
                    <label>Last Name <span className="up__req">*</span></label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" required />
                  </div>
                </div>
                <div className="up__field">
                  <label>Email <span className="up__req">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" required />
                </div>
                <div className="up__form-row">
                  <div className="up__field">
                    <label>Role <span className="up__req">*</span></label>
                    <div className="up__role-display"><span>Support Agent</span></div>
                  </div>
                  <div className="up__field">
                    <label>Department</label>
                    <DepartmentSelect
                      value={formData.department}
                      onChange={(val) => setFormData(prev => ({ ...prev, department: val }))}
                      departments={departments}
                      onAddDepartment={handleAddDepartment}
                    />
                  </div>
                </div>
                <div className="up__form-actions">
                  <button type="button" className="up__btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="up__btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create User'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Edit Modal ── */}
        {showEditModal && selectedUser && (
          <div className="up__overlay" onClick={() => setShowEditModal(false)}>
            <div className="up__modal" onClick={(e) => e.stopPropagation()}>
              <div className="up__modal-head">
                <div>
                  <h2>Edit User</h2>
                  <p className="up__modal-sub">Update user details</p>
                </div>
                <button className="up__modal-close" onClick={() => setShowEditModal(false)}><IconClose /></button>
              </div>
              <form onSubmit={handleUpdateUser} className="up__form">
                <div className="up__form-row">
                  <div className="up__field">
                    <label>First Name</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="John" />
                  </div>
                  <div className="up__field">
                    <label>Last Name</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" />
                  </div>
                </div>
                <div className="up__field">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" disabled />
                </div>
                {selectedUser.role === 'SUPPORT_AGENT' && (
                  <div className="up__field">
                    <label>Department</label>
                    <DepartmentSelect
                      value={formData.department}
                      onChange={(val) => setFormData(prev => ({ ...prev, department: val }))}
                      departments={departments}
                      onAddDepartment={handleAddDepartment}
                    />
                  </div>
                )}
                <div className="up__field">
                  <label>Status</label>
                  <div className="up__select-wrap">
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                    <IconChevron />
                  </div>
                </div>
                <div className="up__form-actions">
                  <button type="button" className="up__btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="up__btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default UsersPage;