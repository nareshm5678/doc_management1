import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Eye,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [formsResponse, statsResponse] = await Promise.all([
        axios.get('/forms'),
        axios.get('/users/dashboard/stats').catch(() => ({ data: {} }))
      ]);
      
      setForms(formsResponse.data);
      setStats(statsResponse.data || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <Clock className="status-icon draft" size={16} />;
      case 'submitted':
        return <AlertCircle className="status-icon submitted" size={16} />;
      case 'reviewed':
        return <AlertCircle className="status-icon reviewed" size={16} />;
      case 'approved':
        return <CheckCircle className="status-icon approved" size={16} />;
      case 'rejected':
        return <XCircle className="status-icon rejected" size={16} />;
      case 'disapproved':
        return <XCircle className="status-icon disapproved" size={16} />;
      default:
        return <FileText className="status-icon" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#6c757d';
      case 'submitted': return '#ffc107';
      case 'reviewed': return '#17a2b8';
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'disapproved': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const getFormsByStatus = (status) => {
    return forms.filter(form => form.status === status).length;
  };

  const quickActions = [
    {
      title: 'Create New Form',
      description: 'Start a new documentation form',
      icon: Plus,
      action: '/forms/new',
      color: '#28a745',
      roles: ['operator']
    },
    {
      title: 'Operator Production Log',
      description: 'Fill out daily production log form',
      icon: FileText,
      action: '/forms/operator-log',
      color: '#007bff',
      roles: ['operator']
    },
    {
      title: 'Review Forms',
      description: 'Review submitted forms',
      icon: Eye,
      action: '/forms/review',
      color: '#17a2b8',
      roles: ['supervisor', 'admin']
    }
  ];

  const visibleActions = quickActions.filter(action => 
    action.roles.includes(user?.role)
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Check if user is an operator
  const isOperator = user?.role === 'operator';

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Welcome, {user?.name || 'User'}</h1>
            <p>Here's what's happening with your forms</p>
          </div>
          {isOperator && (
            <Link to="/forms/new" className="btn primary">
              <Plus size={16} style={{ marginRight: '8px' }} />
              New Operator Form
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon draft">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{getFormsByStatus('draft')}</h3>
            <p>Draft Forms</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon submitted">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{getFormsByStatus('submitted')}</h3>
            <p>Pending Review</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon approved">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{getFormsByStatus('approved')}</h3>
            <p>Approved Forms</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon disapproved">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{getFormsByStatus('disapproved')}</h3>
            <p>Disapproved Forms</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {visibleActions.length > 0 && (
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            {visibleActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.action}
                  className="action-card"
                  style={{ borderTopColor: action.color }}
                >
                  <div className="action-icon" style={{ color: action.color }}>
                    <Icon size={32} />
                  </div>
                  <h4>{action.title}</h4>
                  <p>{action.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Forms */}
      <div className="recent-forms">
        <h3>Recent Forms</h3>
        <div className="forms-list">
          {forms.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h4>No forms yet</h4>
              <p>Create your first form to get started</p>
              {user?.role === 'operator' && (
                <Link to="/forms/new" className="empty-state-button">
                  <Plus size={16} />
                  Create Form
                </Link>
              )}
            </div>
          ) : (
            forms.slice(0, 10).map((form) => (
              <div key={form._id} className="form-item">
                <div className="form-header">
                  <div className="form-title">
                    {getStatusIcon(form.status)}
                    <span>{form.title}</span>
                  </div>
                  <div 
                    className="form-status"
                    style={{ color: getStatusColor(form.status) }}
                  >
                    {form.status.toUpperCase()}
                  </div>
                </div>
                <div className="form-meta">
                  <span className="form-department">{form.department}</span>
                  <span className="form-date">
                    <Calendar size={14} />
                    {format(new Date(form.createdAt), 'MMM dd, yyyy')}
                  </span>
                  <span className="form-author">
                    by {form.submittedBy?.username}
                  </span>
                </div>
                {form.description && (
                  <p className="form-description">{form.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
