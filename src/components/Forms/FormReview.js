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
  Send,
  Paperclip,
  Image,
  File,
  Archive,
  Ban
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
      console.log('Selected form data:', response.data);
      console.log('Attachments in selected form:', response.data.attachments);
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
    if (!formData) {
      return <div className="no-data">No form data available</div>;
    }

    // Handle operator form data structure
    if (formData.productMachineInfo || formData.operationalParams || formData.inspection) {
      return (
        <div className="operator-form-data">
          {/* Product & Machine Info */}
          {formData.productMachineInfo && (
            <div className="form-section">
              <h5>Product & Machine Information</h5>
              <div className="form-data-grid">
                {Object.entries(formData.productMachineInfo).map(([key, value]) => {
                  if (!value && value !== 0) return null;
                  
                  // Handle complex objects
                  const displayValue = typeof value === 'object' && value !== null
                    ? JSON.stringify(value, null, 2)
                    : Array.isArray(value)
                    ? value.join(', ')
                    : value.toString();
                  
                  return (
                    <div key={key} className="form-data-item">
                      <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</label>
                      <div className="form-data-value">{displayValue}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Operational Parameters */}
          {formData.operationalParams && (
            <div className="form-section">
              <h5>Operational Parameters</h5>
              <div className="form-data-grid">
                {Object.entries(formData.operationalParams).map(([key, value]) => {
                  if (!value && value !== 0) return null;
                  
                  // Handle complex objects
                  const displayValue = typeof value === 'object' && value !== null
                    ? JSON.stringify(value, null, 2)
                    : Array.isArray(value)
                    ? value.join(', ')
                    : value.toString();
                  
                  return (
                    <div key={key} className="form-data-item">
                      <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</label>
                      <div className="form-data-value">{displayValue}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inspection & Quality */}
          {formData.inspection && (
            <div className="form-section">
              <h5>Inspection & Quality</h5>
              <div className="form-data-grid">
                {Object.entries(formData.inspection).map(([key, value]) => {
                  if (!value && value !== 0) return null;
                  
                  // Handle complex objects
                  const displayValue = typeof value === 'object' && value !== null
                    ? JSON.stringify(value, null, 2)
                    : Array.isArray(value)
                    ? value.join(', ')
                    : value.toString();
                  
                  return (
                    <div key={key} className="form-data-item">
                      <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</label>
                      <div className="form-data-value">
                        {displayValue}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Handle template-based form data
    if (template && template.fields) {
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
    }

    // Fallback: display all form data as key-value pairs
    return (
      <div className="generic-form-data">
        {Object.entries(formData).map(([key, value]) => {
          if (!value && value !== 0) return null;
          if (typeof value === 'object') return null; // Skip complex objects
          
          return (
            <div key={key} className="form-data-item">
              <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</label>
              <div className="form-data-value">
                {Array.isArray(value) ? value.join(', ') : value.toString()}
              </div>
            </div>
          );
        })}
      </div>
    );
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
                  <h4>
                    <FileText size={20} />
                    Form Data
                  </h4>
                  <div className="form-data">
                    {renderFormData(selectedForm.formData, selectedForm.template)}
                  </div>
                </div>

                {/* Attachments */}
                {selectedForm.attachments && selectedForm.attachments.length > 0 ? (
                  <div className="detail-section">
                    <h4>
                      <Paperclip size={20} />
                      Attachments ({selectedForm.attachments.length})
                    </h4>
                    <div className="attachments">
                      {selectedForm.attachments.map((attachment, index) => {
                        // Enhanced file type icon function
                        const getFileIcon = (fileType, filename) => {
                          const ext = filename?.split('.').pop()?.toLowerCase();
                          if (fileType === 'pdf' || ext === 'pdf') {
                            return <FileText size={20} style={{color: '#dc2626'}} />;
                          } else if (['doc', 'docx', 'txt', 'rtf'].includes(ext) || fileType === 'document') {
                            return <File size={20} style={{color: '#2563eb'}} />;
                          } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext) || fileType === 'image') {
                            return <Image size={20} style={{color: '#059669'}} />;
                          } else if (['xls', 'xlsx', 'csv'].includes(ext) || fileType === 'spreadsheet') {
                            return <FileText size={20} style={{color: '#059669'}} />;
                          } else if (['ppt', 'pptx'].includes(ext)) {
                            return <FileText size={20} style={{color: '#ea580c'}} />;
                          } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
                            return <Archive size={20} style={{color: '#7c2d12'}} />;
                          }
                          return <FileText size={20} style={{color: '#6b7280'}} />;
                        };

                        const formatFileSize = (bytes) => {
                          if (!bytes) return 'Unknown size';
                          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                          if (bytes === 0) return '0 Bytes';
                          const i = Math.floor(Math.log(bytes) / Math.log(1024));
                          return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
                        };

                        return (
                          <div key={index} className="attachment-item">
                            <div className="attachment-icon">
                              {getFileIcon(attachment.fileType, attachment.originalName || attachment.filename)}
                            </div>
                            <div className="attachment-info">
                              <div className="attachment-name">
                                {attachment.originalName || attachment.filename || 'Unknown file'}
                              </div>
                              {attachment.description && (
                                <div className="attachment-description">
                                  {attachment.description}
                                </div>
                              )}
                              <div className="attachment-meta">
                                <span className="attachment-size">
                                  {formatFileSize(attachment.size)}
                                </span>
                                {attachment.fileType && (
                                  <span className="attachment-type">
                                    {attachment.fileType.toUpperCase()}
                                  </span>
                                )}
                                {attachment.uploadedBy && (
                                  <span className="attachment-uploader">
                                    Uploaded by {attachment.uploadedBy}
                                  </span>
                                )}
                                {attachment.uploadDate && (
                                  <span className="attachment-date">
                                    {format(new Date(attachment.uploadDate), 'MMM dd, yyyy')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="attachment-actions">
                              <button 
                                className="download-btn"
                                onClick={() => {
                                  const filename = attachment.filename || attachment.originalName;
                                  window.open(`/api/forms/${selectedForm._id}/attachments/${filename}`, '_blank');
                                }}
                                title="Download file"
                              >
                                <Download size={16} />
                              </button>
                              <button 
                                className="view-btn"
                                onClick={() => {
                                  const filename = attachment.filename || attachment.originalName;
                                  window.open(`/api/forms/${selectedForm._id}/attachments/${filename}/view`, '_blank');
                                }}
                                title="View file"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="detail-section">
                    <h4>
                      <Paperclip size={20} />
                      Attachments
                    </h4>
                    <div className="no-data">
                      No attachments were uploaded with this form.
                    </div>
                  </div>
                )}

                {/* Operator Signature */}
                {selectedForm.signOff && selectedForm.signOff.operatorSignature && (
                  <div className="detail-section">
                    <h4>
                      <User size={20} />
                      Operator Signature
                    </h4>
                    <div className="signature-section">
                      <div className="signature-details">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <label>Signed By:</label>
                            <span>{selectedForm.signOff.operatorName}</span>
                          </div>
                          <div className="detail-item">
                            <label>Signed On:</label>
                            <span>{format(new Date(selectedForm.signOff.submissionDate), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="signature-display">
                        <label>Digital Signature:</label>
                        <div className="signature-container">
                          <img 
                            src={selectedForm.signOff.operatorSignature} 
                            alt="Operator Signature" 
                            className="signature-image"
                            style={{
                              maxWidth: '300px',
                              maxHeight: '150px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              padding: '8px',
                              background: '#fff'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments */}
                {selectedForm.comments && selectedForm.comments.length > 0 && (
                  <div className="detail-section">
                    <h4>
                      <MessageCircle size={20} />
                      Comments ({selectedForm.comments.length})
                    </h4>
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
                  <h4>
                    <CheckCircle size={20} />
                    Review Action
                  </h4>
                  <div className="review-actions">
                    <div className="action-buttons-container">
                      <div className={`action-buttons-grid ${user.role === 'supervisor' ? 'supervisor-grid' : 'admin-grid'}`}>
                        {user.role === 'supervisor' ? (
                          <>
                            <button
                              className={`action-btn action-btn-approve ${reviewAction === 'approve' ? 'selected' : ''}`}
                              onClick={() => setReviewAction('approve')}
                              title="Approve this form and mark it as completed"
                            >
                              <div className="btn-icon">
                                <CheckCircle size={16} />
                              </div>
                              <div className="btn-content">
                                <span className="btn-title">Approve</span>
                                <span className="btn-subtitle">Mark as approved</span>
                              </div>
                            </button>
                            <button
                              className={`action-btn action-btn-disapprove ${reviewAction === 'disapprove' ? 'selected' : ''}`}
                              onClick={() => setReviewAction('disapprove')}
                              title="Disapprove this form and send back to operator"
                            >
                              <div className="btn-icon">
                                <XCircle size={16} />
                              </div>
                              <div className="btn-content">
                                <span className="btn-title">Disapprove</span>
                                <span className="btn-subtitle">Send back to operator</span>
                              </div>
                            </button>
                            <button
                              className={`action-btn action-btn-escalate ${reviewAction === 'escalate' ? 'selected' : ''}`}
                              onClick={() => setReviewAction('escalate')}
                              title="Send this form to admin for further review"
                            >
                              <div className="btn-icon">
                                <Send size={16} />
                              </div>
                              <div className="btn-content">
                                <span className="btn-title">Escalate</span>
                                <span className="btn-subtitle">Send to admin</span>
                              </div>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className={`action-btn action-btn-approve ${reviewAction === 'approve' ? 'selected' : ''}`}
                              onClick={() => setReviewAction('approve')}
                              title="Approve this form and mark it as completed"
                            >
                              <div className="btn-icon">
                                <CheckCircle size={18} />
                              </div>
                              <div className="btn-content">
                                <span className="btn-title">Approve</span>
                                <span className="btn-subtitle">Final approval</span>
                              </div>
                            </button>
                            <button
                              className={`action-btn action-btn-disapprove ${reviewAction === 'disapprove' ? 'selected' : ''}`}
                              onClick={() => setReviewAction('disapprove')}
                              title="Disapprove this form and send back to operator"
                            >
                              <div className="btn-icon">
                                <XCircle size={18} />
                              </div>
                              <div className="btn-content">
                                <span className="btn-title">Disapprove</span>
                                <span className="btn-subtitle">Send back to operator</span>
                              </div>
                            </button>
                            <button
                              className={`action-btn action-btn-reject ${reviewAction === 'reject' ? 'selected' : ''}`}
                              onClick={() => setReviewAction('reject')}
                              title="Reject this form permanently"
                            >
                              <div className="btn-icon">
                                <Ban size={18} />
                              </div>
                              <div className="btn-content">
                                <span className="btn-title">Reject</span>
                                <span className="btn-subtitle">Permanent rejection</span>
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                      
                      {reviewAction && (
                        <div className="selected-action-info">
                          <div className="info-badge">
                            {reviewAction === 'approve' && (
                              <>
                                <CheckCircle size={16} className="text-success" />
                                <span>Form will be approved</span>
                              </>
                            )}
                            {reviewAction === 'disapprove' && (
                              <>
                                <XCircle size={16} className="text-warning" />
                                <span>{user.role === 'admin' ? 'Form will be disapproved and sent back to operator' : 'Form will be disapproved and sent back'}</span>
                              </>
                            )}
                            {reviewAction === 'escalate' && (
                              <>
                                <Send size={16} className="text-warning" />
                                <span>Form will be escalated to admin</span>
                              </>
                            )}
                            {reviewAction === 'reject' && (
                              <>
                                <Ban size={16} className="text-danger" />
                                <span>Form will be permanently rejected</span>
                              </>
                            )}
                          </div>
                        </div>
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

                    <div className="submit-section">
                      <button
                        className={`submit-review-btn ${reviewAction ? `submit-${reviewAction}` : ''}`}
                        onClick={handleReview}
                        disabled={!reviewAction || submitting}
                      >
                        <div className="submit-btn-content">
                          {submitting ? (
                            <>
                              <div className="spinner"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              {reviewAction === 'approve' && <CheckCircle size={18} />}
                              {reviewAction === 'disapprove' && <XCircle size={18} />}
                              {reviewAction === 'escalate' && <Send size={18} />}
                              {reviewAction === 'reject' && <Ban size={18} />}
                              <span>
                                {reviewAction === 'approve' && 'Submit Approval'}
                                {reviewAction === 'disapprove' && (user.role === 'admin' ? 'Disapprove & Send to Operator' : 'Submit Disapproval')}
                                {reviewAction === 'escalate' && 'Escalate to Admin'}
                                {reviewAction === 'reject' && 'Permanently Reject'}
                                {!reviewAction && 'Select Action First'}
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                      
                      {!reviewAction && (
                        <p className="submit-help-text">
                          Please select an action above before submitting your review.
                        </p>
                      )}
                    </div>
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
