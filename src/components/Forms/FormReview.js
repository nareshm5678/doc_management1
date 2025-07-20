import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  MessageCircle,
  Calendar,
  User,
  Download,
  Send
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import './FormReview.css';

const FormReview = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewAction, setReviewAction] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await axios.get('/forms');
      // Filter forms that need review based on user role
      let filteredForms = response.data;
      
      if (user.role === 'supervisor') {
        filteredForms = response.data.filter(form => 
          form.status === 'submitted' && form.department === user.department
        );
      } else if (user.role === 'admin') {
        filteredForms = response.data.filter(form => 
          form.status === 'reviewed' || form.status === 'submitted'
        );
      }
      
      setForms(filteredForms);
    } catch (error) {
      console.error('Error fetching forms:', error);
      setMessage({ type: 'error', text: 'Failed to load forms' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <AlertCircle className="status-icon submitted" size={16} />;
      case 'reviewed':
        return <AlertCircle className="status-icon reviewed" size={16} />;
      case 'approved':
        return <CheckCircle className="status-icon approved" size={16} />;
      case 'rejected':
        return <XCircle className="status-icon rejected" size={16} />;
      default:
        return <FileText className="status-icon" size={16} />;
    }
  };

  const handleFormSelect = async (form) => {
    try {
      const response = await axios.get(`/forms/${form._id}`);
      setSelectedForm(response.data);
      setComment('');
      setReviewAction('');
    } catch (error) {
      console.error('Error fetching form details:', error);
    }
  };

  const handleReview = async () => {
    if (!reviewAction) {
      setMessage({ type: 'error', text: 'Please select an action' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const endpoint = user.role === 'supervisor' ? 
        `/forms/${selectedForm._id}/review` : 
        `/forms/${selectedForm._id}/approve`;
        
      await axios.patch(endpoint, {
        action: reviewAction,
        comment: comment.trim()
      });

      setMessage({ 
        type: 'success', 
        text: `Form ${reviewAction}d successfully!` 
      });
      
      // Refresh forms list
      await fetchForms();
      setSelectedForm(null);
      setComment('');
      setReviewAction('');
    } catch (error) {
      console.error('Error reviewing form:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to review form' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormData = (formData, template) => {
    if (!template || !template.fields) return null;

    return template.fields.map((field) => {
      const value = formData[field.id];
      if (!value && value !== 0) return null;

      return (
        <div key={field.id} className="form-data-item">
          <label>{field.label}:</label>
          <div className="form-data-value">
            {Array.isArray(value) ? value.join(', ') : value.toString()}
          </div>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="review-loading">
        <div className="loading-spinner"></div>
        <p>Loading forms...</p>
      </div>
    );
  }

  return (
    <div className="form-review">
      <div className="review-header">
        <h2>Form Review</h2>
        <p>Review and approve submitted forms</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className="review-layout">
        {/* Forms List */}
        <div className="forms-panel">
          <h3>Forms for Review ({forms.length})</h3>
          <div className="forms-list">
            {forms.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} />
                <h4>No forms to review</h4>
                <p>All forms have been processed</p>
              </div>
            ) : (
              forms.map((form) => (
                <div
                  key={form._id}
                  className={`form-list-item ${selectedForm?._id === form._id ? 'selected' : ''}`}
                  onClick={() => handleFormSelect(form)}
                >
                  <div className="form-item-header">
                    <div className="form-item-title">
                      {getStatusIcon(form.status)}
                      <span>{form.title}</span>
                    </div>
                    <div className="form-item-status">
                      {form.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="form-item-meta">
                    <span className="form-department">{form.department}</span>
                    <span className="form-date">
                      <Calendar size={12} />
                      {format(new Date(form.createdAt), 'MMM dd, yyyy')}
                    </span>
                    <span className="form-author">
                      <User size={12} />
                      {form.submittedBy?.username}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Form Details */}
        <div className="form-details-panel">
          {selectedForm ? (
            <>
              <div className="form-details-header">
                <h3>{selectedForm.title}</h3>
                <div className="form-status-badge" data-status={selectedForm.status}>
                  {selectedForm.status.toUpperCase()}
                </div>
              </div>

              <div className="form-details-content">
                {/* Basic Info */}
                <div className="detail-section">
                  <h4>Form Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Department:</label>
                      <span>{selectedForm.department}</span>
                    </div>
                    <div className="detail-item">
                      <label>Submitted By:</label>
                      <span>{selectedForm.submittedBy?.username}</span>
                    </div>
                    <div className="detail-item">
                      <label>Submitted On:</label>
                      <span>{format(new Date(selectedForm.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    {selectedForm.reviewedBy && (
                      <div className="detail-item">
                        <label>Reviewed By:</label>
                        <span>{selectedForm.reviewedBy.username}</span>
                      </div>
                    )}
                  </div>
                  {selectedForm.description && (
                    <div className="detail-item">
                      <label>Description:</label>
                      <p>{selectedForm.description}</p>
                    </div>
                  )}
                </div>

                {/* Form Data */}
                <div className="detail-section">
                  <h4>Form Data</h4>
                  <div className="form-data">
                    {renderFormData(selectedForm.formData, selectedForm.template)}
                  </div>
                </div>

                {/* Attachments */}
                {selectedForm.attachments && selectedForm.attachments.length > 0 && (
                  <div className="detail-section">
                    <h4>Attachments</h4>
                    <div className="attachments">
                      {selectedForm.attachments.map((attachment, index) => (
                        <div key={index} className="attachment-item">
                          <FileText size={16} />
                          <span>{attachment.originalName}</span>
                          <button className="download-btn">
                            <Download size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                {selectedForm.comments && selectedForm.comments.length > 0 && (
                  <div className="detail-section">
                    <h4>Comments</h4>
                    <div className="comments-list">
                      {selectedForm.comments.map((comment, index) => (
                        <div key={index} className="comment-item">
                          <div className="comment-header">
                            <span className="comment-author">{comment.user?.username}</span>
                            <span className="comment-date">
                              {format(new Date(comment.timestamp), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          <p className="comment-text">{comment.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Actions */}
                <div className="detail-section">
                  <h4>Review Action</h4>
                  <div className="review-actions">
                    <div className="action-buttons">
                      {user.role === 'supervisor' ? (
                        <>
                          <button
                            className={`action-btn approve ${reviewAction === 'approve' ? 'selected' : ''}`}
                            onClick={() => setReviewAction('approve')}
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            className={`action-btn escalate ${reviewAction === 'escalate' ? 'selected' : ''}`}
                            onClick={() => setReviewAction('escalate')}
                          >
                            <Send size={16} />
                            Escalate to Admin
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className={`action-btn approve ${reviewAction === 'approve' ? 'selected' : ''}`}
                            onClick={() => setReviewAction('approve')}
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            className={`action-btn reject ${reviewAction === 'reject' ? 'selected' : ''}`}
                            onClick={() => setReviewAction('reject')}
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </>
                      )}
                    </div>

                    <div className="comment-section">
                      <label htmlFor="comment">Comment (Optional):</label>
                      <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment about your decision..."
                        rows={3}
                      />
                    </div>

                    <button
                      className="submit-review-btn"
                      onClick={handleReview}
                      disabled={!reviewAction || submitting}
                    >
                      <MessageCircle size={16} />
                      {submitting ? 'Processing...' : 'Submit Review'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <Eye size={48} />
              <h3>Select a form to review</h3>
              <p>Choose a form from the list to view details and take action</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormReview;
