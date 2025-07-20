import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, 
  Edit3, 
  Send, 
  Trash2, 
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus
} from 'lucide-react';
import axios from 'axios';
import './MyForms.css';

const MyForms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, draft, submitted, approved, rejected
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchMyForms();
  }, []);

  const fetchMyForms = async () => {
    try {
      const response = await axios.get('/forms');
      setForms(response.data);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredForms = forms.filter(form => {
    if (filter === 'all') return true;
    return form.status === filter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <Edit3 size={16} className="status-icon draft" />;
      case 'submitted':
        return <Clock size={16} className="status-icon submitted" />;
      case 'reviewed':
        return <AlertCircle size={16} className="status-icon reviewed" />;
      case 'approved':
        return <CheckCircle size={16} className="status-icon approved" />;
      case 'rejected':
        return <XCircle size={16} className="status-icon rejected" />;
      default:
        return <FileText size={16} className="status-icon" />;
    }
  };

  const getStatusClass = (status) => {
    return `status-badge ${status}`;
  };

  const handleEditForm = (formId) => {
    navigate(`/forms/edit/${formId}`);
  };

  const handleViewForm = (formId) => {
    navigate(`/forms/view/${formId}`);
  };

  const handleSubmitForm = async (formId) => {
    try {
      await axios.patch(`/forms/${formId}/submit`);
      fetchMyForms(); // Refresh the list
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form');
    }
  };

  const handleDeleteForm = async (formId) => {
    try {
      await axios.delete(`/forms/${formId}`);
      setForms(forms.filter(form => form._id !== formId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('Failed to delete form');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading your forms...</div>;
  }

  return (
    <div className="my-forms">
      <div className="my-forms-header">
        <h1>My Forms</h1>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/forms/new')}
        >
          <Plus size={20} />
          New Form
        </button>
      </div>

      <div className="forms-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({forms.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'draft' ? 'active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          Drafts ({forms.filter(f => f.status === 'draft').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'submitted' ? 'active' : ''}`}
          onClick={() => setFilter('submitted')}
        >
          Submitted ({forms.filter(f => f.status === 'submitted').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved ({forms.filter(f => f.status === 'approved').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({forms.filter(f => f.status === 'rejected').length})
        </button>
      </div>

      {filteredForms.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} className="empty-icon" />
          <h3>No forms found</h3>
          <p>
            {filter === 'all' 
              ? "You haven't created any forms yet." 
              : `No ${filter} forms found.`}
          </p>
          {filter === 'all' && (
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/forms/new')}
            >
              Create Your First Form
            </button>
          )}
        </div>
      ) : (
        <div className="forms-list">
          {filteredForms.map((form) => (
            <div key={form._id} className="form-card">
              <div className="form-header">
                <div className="form-title">
                  <FileText size={20} />
                  <h3>{form.title}</h3>
                </div>
                <div className={getStatusClass(form.status)}>
                  {getStatusIcon(form.status)}
                  {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                </div>
              </div>

              <div className="form-meta">
                <p className="form-description">{form.description || 'No description'}</p>
                <div className="form-details">
                  <span className="detail">Template: {form.template}</span>
                  <span className="detail">Created: {formatDate(form.createdAt)}</span>
                  {form.updatedAt !== form.createdAt && (
                    <span className="detail">Updated: {formatDate(form.updatedAt)}</span>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleViewForm(form._id)}
                >
                  <Eye size={16} />
                  View
                </button>

                {form.status === 'draft' && (
                  <>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleEditForm(form._id)}
                    >
                      <Edit3 size={16} />
                      Edit
                    </button>

                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => handleSubmitForm(form._id)}
                    >
                      <Send size={16} />
                      Submit
                    </button>

                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteConfirm(form._id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                )}
              </div>

              {form.attachments && form.attachments.length > 0 && (
                <div className="form-attachments">
                  <strong>Attachments ({form.attachments.length}):</strong>
                  {form.attachments.map((attachment, index) => (
                    <span key={index} className="attachment-name">
                      {attachment.originalName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Form</h3>
            <p>Are you sure you want to delete this draft? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleDeleteForm(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyForms;
