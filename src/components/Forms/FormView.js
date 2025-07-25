import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, 
  ArrowLeft,
  Download,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';
import axios from 'axios';
import './FormView.css';

const FormView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await axios.get(`/forms/${id}`);
      const formData = response.data;
      setForm(formData);
      
      // Fetch template details
      const templatesResponse = await axios.get('/forms/templates');
      const templateData = templatesResponse.data.find(t => t.name === formData.template);
      setTemplate(templateData);
      
    } catch (error) {
      console.error('Error fetching form:', error);
      alert('Failed to load form');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    return `status-badge ${status}`;
  };

  const renderFieldValue = (field, value) => {
    if (!value && value !== 0) return <span className="no-value">No value provided</span>;

    switch (field.type) {
      case 'textarea':
        return <div className="textarea-value">{value}</div>;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'checkbox':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'radio':
      case 'select':
        return value;
      default:
        return value;
    }
  };

  if (loading) {
    return <div className="loading">Loading form...</div>;
  }

  if (!form || !template) {
    return <div className="error">Form not found</div>;
  }

  return (
    <div className="form-view">
      <div className="form-view-header">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>{form.title}</h1>
      </div>

      <div className="form-view-content">
        <div className="form-info-card">
          <div className="form-basic-info">
            <div className="info-row">
              <strong>Status:</strong>
              <div className={getStatusClass(form.status)}>
                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
              </div>
            </div>
            
            <div className="info-row">
              <strong>Template:</strong>
              <span>{form.template}</span>
            </div>
            
            <div className="info-row">
              <strong>Department:</strong>
              <span>{form.department}</span>
            </div>
            
            <div className="info-row">
              <strong>Submitted by:</strong>
              <span className="user-info">
                <User size={16} />
                {form.submittedBy?.username}
              </span>
            </div>
            
            <div className="info-row">
              <strong>Created:</strong>
              <span className="date-info">
                <Calendar size={16} />
                {formatDate(form.createdAt)}
              </span>
            </div>
            
            {form.updatedAt !== form.createdAt && (
              <div className="info-row">
                <strong>Last Updated:</strong>
                <span className="date-info">
                  <Calendar size={16} />
                  {formatDate(form.updatedAt)}
                </span>
              </div>
            )}
          </div>

          {form.description && (
            <div className="form-description">
              <strong>Description:</strong>
              <p>{form.description}</p>
            </div>
          )}
        </div>

        <div className="form-fields-view">
          <h3>Form Data</h3>
          {template.fields?.map((field) => (
            <div key={field.id} className="field-view">
              <label className="field-label">
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>
              <div className="field-value">
                {renderFieldValue(field, form.formData[field.id])}
              </div>
            </div>
          ))}
        </div>

        {form.attachments && form.attachments.length > 0 && (
          <div className="attachments-view">
            <h3>Attachments</h3>
            <div className="attachments-list">
              {form.attachments.map((attachment, index) => (
                <div key={index} className="attachment-item">
                  <FileText size={20} />
                  <div className="attachment-info">
                    <div className="attachment-name">{attachment.originalName}</div>
                    <div className="attachment-meta">
                      {(attachment.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => window.open(`/uploads/${attachment.filename}`, '_blank')}
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {form.comments && form.comments.length > 0 && (
          <div className="comments-view">
            <h3>Comments</h3>
            <div className="comments-list">
              {form.comments.map((comment, index) => (
                <div key={index} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-user">
                      <MessageSquare size={16} />
                      {comment.user?.username}
                    </span>
                    <span className="comment-date">
                      {formatDate(comment.timestamp)}
                    </span>
                  </div>
                  <div className="comment-message">{comment.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {form.auditLog && form.auditLog.length > 0 && (
          <div className="audit-log-view">
            <h3>Audit Trail</h3>
            <div className="audit-list">
              {form.auditLog.map((log, index) => (
                <div key={index} className="audit-item">
                  <div className="audit-action">{log.action}</div>
                  <div className="audit-details">
                    by {log.performedBy?.username || 'System'} on {formatDate(log.timestamp)}
                    {log.details && ` - ${log.details}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormView;
