const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Form = require('../models/Form');
const Template = require('../models/Template');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get all templates
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user.role !== 'admin') {
      filter.department = req.user.department;
    }
    
    const templates = await Template.find(filter).populate('createdBy', 'username');
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new template (Admin only)
router.post('/templates', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const template = new Template({
      ...req.body,
      createdBy: req.user._id
    });
    
    await template.save();
    await template.populate('createdBy', 'username');
    
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get forms based on user role
router.get('/', authenticateToken, async (req, res) => {
  try {
    let filter = {};
    
    switch (req.user.role) {
      case 'operator':
        filter.submittedBy = req.user._id;
        break;
      case 'supervisor':
        filter = {
          $or: [
            { department: req.user.department, status: 'submitted' },
            { reviewedBy: req.user._id }
          ]
        };
        break;
      case 'admin':
        // Admin can see all forms
        break;
    }
    
    const forms = await Form.find(filter)
      .populate('submittedBy', 'username')
      .populate('reviewedBy', 'username')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 });
    
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new form
router.post('/', authenticateToken, authorize('operator'), upload.array('attachments', 5), async (req, res) => {
  try {
    const formData = JSON.parse(req.body.formData);
    
    const attachments = req.files?.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    })) || [];
    
    const form = new Form({
      title: req.body.title,
      description: req.body.description,
      department: req.user.department,
      template: req.body.template,
      formData,
      attachments,
      submittedBy: req.user._id
    });
    
    form.addAuditLog('created', req.user._id, 'Form created');
    
    await form.save();
    await form.populate('submittedBy', 'username');
    
    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific form by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    
    // Apply role-based access control
    switch (req.user.role) {
      case 'operator':
        filter.submittedBy = req.user._id;
        break;
      case 'supervisor':
        filter = {
          _id: req.params.id,
          $or: [
            { department: req.user.department },
            { reviewedBy: req.user._id }
          ]
        };
        break;
      case 'admin':
        // Admin can see any form
        break;
    }
    
    const form = await Form.findOne(filter)
      .populate('submittedBy', 'username')
      .populate('reviewedBy', 'username')
      .populate('approvedBy', 'username')
      .populate('comments.user', 'username');
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update draft form
router.put('/:id', authenticateToken, authorize('operator'), upload.array('attachments', 5), async (req, res) => {
  try {
    const form = await Form.findOne({ 
      _id: req.params.id, 
      submittedBy: req.user._id,
      status: 'draft'
    });
    
    if (!form) {
      return res.status(404).json({ message: 'Draft form not found' });
    }
    
    // Update form fields
    if (req.body.title) form.title = req.body.title;
    if (req.body.description) form.description = req.body.description;
    if (req.body.formData) {
      form.formData = typeof req.body.formData === 'string' 
        ? JSON.parse(req.body.formData) 
        : req.body.formData;
    }
    
    // Handle new attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));
      form.attachments.push(...newAttachments);
    }
    
    form.addAuditLog('updated', req.user._id, 'Draft form updated');
    
    await form.save();
    await form.populate('submittedBy', 'username');
    
    res.json({ message: 'Form updated successfully', form });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete draft form
router.delete('/:id', authenticateToken, authorize('operator'), async (req, res) => {
  try {
    const form = await Form.findOne({ 
      _id: req.params.id, 
      submittedBy: req.user._id,
      status: 'draft'
    });
    
    if (!form) {
      return res.status(404).json({ message: 'Draft form not found' });
    }
    
    // Delete attached files
    form.attachments.forEach(attachment => {
      if (fs.existsSync(attachment.path)) {
        fs.unlinkSync(attachment.path);
      }
    });
    
    await Form.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Draft form deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit form
router.patch('/:id/submit', authenticateToken, authorize('operator'), async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, submittedBy: req.user._id });
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    form.status = 'submitted';
    form.addAuditLog('submitted', req.user._id, 'Form submitted for review');
    
    await form.save();
    
    res.json({ message: 'Form submitted successfully', form });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Review form (Supervisor)
router.patch('/:id/review', authenticateToken, authorize('supervisor'), async (req, res) => {
  try {
    const { action, comment } = req.body; // action: 'approve' or 'escalate'
    
    const form = await Form.findOne({ 
      _id: req.params.id, 
      department: req.user.department,
      status: 'submitted'
    });
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    form.reviewedBy = req.user._id;
    
    if (comment) {
      form.comments.push({
        user: req.user._id,
        message: comment
      });
    }
    
    if (action === 'approve') {
      form.status = 'approved';
      form.approvedBy = req.user._id;
      form.addAuditLog('approved', req.user._id, 'Form approved by supervisor');
    } else if (action === 'escalate') {
      form.status = 'reviewed';
      form.addAuditLog('escalated', req.user._id, 'Form escalated to admin');
    }
    
    await form.save();
    
    res.json({ message: 'Form reviewed successfully', form });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Final approval (Admin)
router.patch('/:id/approve', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { action, comment } = req.body; // action: 'approve' or 'reject'
    
    const form = await Form.findOne({ _id: req.params.id, status: 'reviewed' });
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    if (comment) {
      form.comments.push({
        user: req.user._id,
        message: comment
      });
    }
    
    if (action === 'approve') {
      form.status = 'approved';
      form.approvedBy = req.user._id;
      form.addAuditLog('approved', req.user._id, 'Form approved by admin');
    } else if (action === 'reject') {
      form.status = 'rejected';
      form.addAuditLog('rejected', req.user._id, 'Form rejected by admin');
    }
    
    await form.save();
    
    res.json({ message: 'Form processed successfully', form });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get form by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id)
      .populate('submittedBy', 'username')
      .populate('reviewedBy', 'username')
      .populate('approvedBy', 'username')
      .populate('comments.user', 'username')
      .populate('auditLog.performedBy', 'username');
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Check permissions
    if (req.user.role === 'operator' && form.submittedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (req.user.role === 'supervisor' && form.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
