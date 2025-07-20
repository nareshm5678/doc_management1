import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Save, 
  Send, 
  Upload,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import './FormBuilder.css';

const FormBuilder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template: '',
    formData: {},
    attachments: []
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/forms/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setMessage({ type: 'error', text: 'Failed to load templates' });
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      template: template._id,
      formData: {}
    }));
  };

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [fieldId]: value
      }
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const renderFormField = (field) => {
    const value = formData.formData[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="form-input"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="form-textarea"
            rows={4}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="form-input"
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="form-input"
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="form-select"
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map((option, index) => (
              <label key={index} className="radio-label">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  required={field.required}
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
              <label key={index} className="checkbox-label">
                <input
                  type="checkbox"
                  value={option}
                  checked={(value || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = value || [];
                    if (e.target.checked) {
                      handleInputChange(field.id, [...currentValues, option]);
                    } else {
                      handleInputChange(field.id, currentValues.filter(v => v !== option));
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
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="form-input"
          />
        );
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Form title is required' });
      return false;
    }

    if (!selectedTemplate) {
      setMessage({ type: 'error', text: 'Please select a template' });
      return false;
    }

    // Validate required fields
    const requiredFields = selectedTemplate.fields.filter(field => field.required);
    for (const field of requiredFields) {
      const value = formData.formData[field.id];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        setMessage({ type: 'error', text: `${field.label} is required` });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft && !validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('template', formData.template);
      submitData.append('formData', JSON.stringify(formData.formData));

      // Add attachments
      attachments.forEach((file) => {
        submitData.append('attachments', file);
      });

      const response = await axios.post('/forms', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!isDraft) {
        // Submit the form after creating
        await axios.patch(`/forms/${response.data._id}/submit`);
        setMessage({ type: 'success', text: 'Form submitted successfully!' });
      } else {
        setMessage({ type: 'success', text: 'Form saved as draft!' });
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to submit form' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-builder">
      <div className="form-builder-header">
        <h2>Create New Form</h2>
        <p>Fill out the form details and submit for review</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className="form-container">
        {/* Basic Form Info */}
        <div className="form-section">
          <h3>Form Information</h3>
          <div className="form-group">
            <label>Form Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter form title"
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter form description (optional)"
              className="form-textarea"
              rows={3}
            />
          </div>
        </div>

        {/* Template Selection */}
        <div className="form-section">
          <h3>Select Template</h3>
          <div className="template-grid">
            {templates.map((template) => (
              <div
                key={template._id}
                className={`template-card ${selectedTemplate?._id === template._id ? 'selected' : ''}`}
                onClick={() => handleTemplateSelect(template)}
              >
                <FileText size={24} />
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <span className="template-department">{template.department}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Form Fields */}
        {selectedTemplate && (
          <div className="form-section">
            <h3>Form Fields</h3>
            <div className="dynamic-form">
              {selectedTemplate.fields.map((field) => (
                <div key={field.id} className="form-group">
                  <label>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                  </label>
                  {renderFormField(field)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Attachments */}
        <div className="form-section">
          <h3>Attachments</h3>
          <div className="file-upload">
            <input
              type="file"
              id="file-input"
              multiple
              onChange={handleFileChange}
              className="file-input"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
            />
            <label htmlFor="file-input" className="file-upload-label">
              <Upload size={20} />
              Choose Files
            </label>
            <p className="file-help">
              Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, GIF (Max 10MB each)
            </p>
          </div>

          {attachments.length > 0 && (
            <div className="attachments-list">
              <h4>Selected Files:</h4>
              {attachments.map((file, index) => (
                <div key={index} className="attachment-item">
                  <span className="attachment-name">{file.name}</span>
                  <span className="attachment-size">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
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

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading || !formData.title.trim()}
            className="btn-secondary"
          >
            <Save size={16} />
            Save as Draft
          </button>
          
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="btn-primary"
          >
            <Send size={16} />
            {loading ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
