import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, 
  Save, 
  Send, 
  Upload,
  X,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import './FormBuilder.css'; // Reuse FormBuilder styles

const FormEdit = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await axios.get(`/forms/${id}`);
      const formData = response.data;
      
      if (formData.status !== 'draft') {
        alert('Only draft forms can be edited');
        navigate('/forms/my');
        return;
      }

      setForm(formData);
      setTitle(formData.title);
      setDescription(formData.description || '');
      setFormData(formData.formData || {});
      
      // Fetch template details
      const templatesResponse = await axios.get('/forms/templates');
      const templateData = templatesResponse.data.find(t => t.name === formData.template);
      setTemplate(templateData);
      
    } catch (error) {
      console.error('Error fetching form:', error);
      alert('Failed to load form');
      navigate('/forms/my');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: null
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} is not allowed. Please select valid file types.`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (template?.fields) {
      template.fields.forEach(field => {
        if (field.required && (!formData[field.id] || formData[field.id].toString().trim() === '')) {
          newErrors[field.id] = `${field.label} is required`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const submitData = new FormData();
      submitData.append('title', title);
      submitData.append('description', description);
      submitData.append('formData', JSON.stringify(formData));
      
      // Add new attachments
      attachments.forEach(file => {
        submitData.append('attachments', file);
      });

      const response = await axios.put(`/forms/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Draft saved successfully!');
      navigate('/forms/my');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // First save the draft with latest changes
    setSaving(true);
    try {
      const submitData = new FormData();
      submitData.append('title', title);
      submitData.append('description', description);
      submitData.append('formData', JSON.stringify(formData));
      
      attachments.forEach(file => {
        submitData.append('attachments', file);
      });

      await axios.put(`/forms/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Now submit the form
      setSubmitting(true);
      await axios.patch(`/forms/${id}/submit`);
      
      alert('Form submitted successfully!');
      navigate('/forms/my');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form');
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.id] || '';
    const hasError = errors[field.id];

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? 'error' : ''}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? 'error' : ''}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? 'error' : ''}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={hasError ? 'error' : ''}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows="4"
            className={hasError ? 'error' : ''}
          />
        );

      case 'select':
        return (
          <select
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={hasError ? 'error' : ''}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map((option, index) => (
              <label key={index} className="radio-option">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="checkbox-group">
            {field.options?.map((option, index) => (
              <label key={index} className="checkbox-option">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleFieldChange(field.id, [...currentValue, option]);
                    } else {
                      handleFieldChange(field.id, currentValue.filter(v => v !== option));
                    }
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? 'error' : ''}
          />
        );
    }
  };

  if (loading) {
    return <div className="loading">Loading form...</div>;
  }

  if (!form || !template) {
    return <div className="error">Form not found or template unavailable</div>;
  }

  return (
    <div className="form-builder">
      <div className="form-builder-header">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/forms/my')}
        >
          <ArrowLeft size={20} />
          Back to My Forms
        </button>
        <h1>Edit Form</h1>
      </div>

      <div className="form-builder-content">
        <div className="form-basic-info">
          <div className="form-group">
            <label htmlFor="title">Form Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter form title"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows="3"
            />
          </div>
        </div>

        <div className="template-info">
          <h3>Template: {template.name}</h3>
          <p className="template-description">{template.description}</p>
        </div>

        <div className="form-fields">
          <h3>Form Fields</h3>
          {template.fields?.map((field) => (
            <div key={field.id} className="form-group">
              <label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>
              {renderField(field)}
              {errors[field.id] && (
                <span className="error-message">
                  <AlertCircle size={16} />
                  {errors[field.id]}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="form-attachments">
          <h3>Attachments</h3>
          
          {/* Existing attachments */}
          {form.attachments && form.attachments.length > 0 && (
            <div className="existing-attachments">
              <h4>Current Attachments:</h4>
              {form.attachments.map((attachment, index) => (
                <div key={index} className="attachment-item existing">
                  <span>{attachment.originalName}</span>
                  <span className="file-size">({(attachment.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              ))}
            </div>
          )}
          
          {/* New attachments */}
          <div className="file-upload">
            <input
              type="file"
              id="attachments"
              multiple
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
            />
            <label htmlFor="attachments" className="file-upload-label">
              <Upload size={20} />
              Add Files (Max 10MB each)
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="new-attachments">
              <h4>New Attachments:</h4>
              {attachments.map((file, index) => (
                <div key={index} className="attachment-item">
                  <span>{file.name}</span>
                  <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="remove-attachment"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || submitting}
            className="btn btn-secondary"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || submitting}
            className="btn btn-primary"
          >
            <Send size={20} />
            {submitting ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormEdit;
