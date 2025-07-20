import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'operator',
    department: '',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
        department: user.department || '',
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'operator',
        department: '',
        isActive: true
      });
    }
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'operator',
      department: '',
      isActive: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editingUser) {
        // Update user
        const updateData = {
          username: formData.username,
          email: formData.email,
          department: formData.department,
          isActive: formData.isActive
        };
        await axios.put(`/users/${editingUser._id}`, updateData);
        setMessage({ type: 'success', text: 'User updated successfully!' });
      } else {
        // Create user
        await axios.post('/auth/register', formData);
        setMessage({ type: 'success', text: 'User created successfully!' });
      }
      
      await fetchUsers();
      setTimeout(() => {
        closeModal();
      }, 1000);
    } catch (error) {
      console.error('Error saving user:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save user' 
      });
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      await axios.delete(`/users/${userId}`);
      setMessage({ type: 'success', text: 'User deactivated successfully!' });
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to deactivate user' 
      });
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'supervisor': return '#17a2b8';
      case 'operator': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'supervisor': return '👨‍💼';
      case 'operator': return '👨‍💻';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div className="header-content">
          <h2>User Management</h2>
          <p>Manage system users and their permissions</p>
        </div>
        <button className="add-user-btn" onClick={() => openModal()}>
          <Plus size={16} />
          Add User
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-box">
          <Filter size={16} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="operator">Operator</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-users">
                  <Users size={48} />
                  <h4>No users found</h4>
                  <p>Try adjusting your search or filters</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="user-details">
                        <div className="username">{user.username}</div>
                        <div className="email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="role-badge"
                      style={{ 
                        backgroundColor: getRoleColor(user.role),
                        color: 'white'
                      }}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="department">
                      {user.department || '-'}
                    </span>
                  </td>
                  <td>
                    <div className="status-indicator">
                      {user.isActive ? (
                        <>
                          <CheckCircle size={16} className="status-active" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} className="status-inactive" />
                          <span>Inactive</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="created-date">
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="action-btn edit"
                        onClick={() => openModal(user)}
                        title="Edit User"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(user._id)}
                        title="Deactivate User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            {message.text && (
              <div className={`message ${message.type}`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength="6"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  required
                  disabled={editingUser} // Don't allow role changes in edit mode
                >
                  <option value="operator">Operator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {(formData.role === 'operator' || formData.role === 'supervisor') && (
                <div className="form-group">
                  <label>Department {formData.role !== 'admin' ? '*' : ''}</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g., HR, IT, Finance"
                    required={formData.role !== 'admin'}
                  />
                </div>
              )}

              {editingUser && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <span>User is active</span>
                  </label>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
