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
    // Expanded file type support
    const allowedExtensions = /jpeg|jpg|png|gif|pdf|doc|docx|txt|rtf|odt|xls|xlsx|csv|ppt|pptx|zip|rar/;
    const allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/rtf',
      'application/vnd.oasis.opendocument.text',
      // Spreadsheets
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      // Presentations
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Archives
      'application/zip', 'application/x-rar-compressed'
    ];
    
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, DOC, DOCX, TXT, Images, etc.`));
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
    
    console.log(`Retrieved ${forms.length} forms for user role: ${req.user.role}`);
    forms.forEach(form => {
      if (form.attachments && form.attachments.length > 0) {
        console.log(`Form ${form._id} has ${form.attachments.length} attachments:`, 
          form.attachments.map(att => ({ name: att.originalName, type: att.fileType, desc: att.description })));
      }
    });
    
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new form
router.post('/', authenticateToken, authorize('operator'), upload.array('attachments', 5), async (req, res) => {
  try {
    console.log('Form submission received:', {
      body: req.body,
      files: req.files?.length || 0,
      user: req.user?.username || 'unknown'
    });
    
    // Parse form data
    let formData;
    try {
      formData = JSON.parse(req.body.formData);
    } catch (parseError) {
      console.error('Error parsing formData:', parseError);
      return res.status(400).json({ message: 'Invalid form data format', error: parseError.message });
    }
    
    // Helper function to determine file type on server
    const determineFileType = (file) => {
      const fileName = file.originalname.toLowerCase();
      const mimeType = file.mimetype.toLowerCase();
      
      // Check for images
      if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(fileName)) {
        return 'image';
      }
      
      // Check for PDFs
      if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return 'pdf';
      }
      
      // Check for documents
      if (mimeType.includes('document') || 
          mimeType.includes('word') || 
          mimeType.includes('text') ||
          /\.(doc|docx|txt|rtf|odt)$/.test(fileName)) {
        return 'document';
      }
      
      // Check for spreadsheets
      if (mimeType.includes('spreadsheet') || 
          mimeType.includes('excel') ||
          /\.(xls|xlsx|csv|ods)$/.test(fileName)) {
        return 'document';
      }
      
      // Check for presentations
      if (mimeType.includes('presentation') || 
          mimeType.includes('powerpoint') ||
          /\.(ppt|pptx|odp)$/.test(fileName)) {
        return 'document';
      }
      
      return 'other';
    };

    // Parse attachment metadata if provided
    let attachmentMetadata = [];
    if (req.body.attachmentMetadata) {
      try {
        attachmentMetadata = JSON.parse(req.body.attachmentMetadata);
      } catch (parseError) {
        console.warn('Error parsing attachment metadata:', parseError);
      }
    }
    
    // Map files with their metadata
    const attachments = req.files?.map((file, index) => {
      const metadata = attachmentMetadata[index] || {};
      const serverFileType = determineFileType(file);
      return {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        // Use server-side file type detection as fallback
        fileType: metadata.fileType || serverFileType,
        description: metadata.description || '',
        uploadedBy: metadata.uploadedBy || req.user?.username || 'unknown',
        uploadDate: metadata.uploadDate || new Date().toISOString(),
        status: metadata.status || 'uploaded'
      };
    }) || [];
    
    console.log('Processed attachments:', attachments.map(att => ({
      name: att.originalName,
      type: att.fileType,
      size: att.size,
      description: att.description
    })));
    
    // Determine if this is an OperatorForm submission or FormBuilder submission
    const isOperatorForm = formData.productMachineInfo || formData.operationalParams || formData.signOff;
    
    // Create form with proper data mapping based on form type
    const formConfig = {
      title: req.body.title || formData.title || 'Form Submission',
      description: req.body.description || formData.description || '',
      department: req.user?.department || 'manufacturing',
      template: req.body.template || (isOperatorForm ? 'operator_daily_log' : 'general_form'),
      status: 'submitted',
      formData,
      attachments,
      submittedBy: req.user._id
    };
    
    // Add structured data only for OperatorForm submissions
    if (isOperatorForm) {
      formConfig.productMachineInfo = formData.productMachineInfo || {
        machineId: 'N/A',
        productName: 'N/A',
        batchNumber: 'N/A'
      };
      formConfig.operationalParams = formData.operationalParams || {};
      formConfig.inspection = formData.inspection || {};
      formConfig.location = formData.location || { type: 'Point', coordinates: [0, 0] };
      formConfig.signOff = formData.signOff || {
        operatorSignature: 'Digital Signature',
        operatorName: req.user?.username || 'Unknown',
        submissionDate: new Date(),
        ipAddress: req.ip || '',
        userAgent: req.get('User-Agent') || ''
      };
    }
    
    const form = new Form(formConfig);
    
    form.addAuditLog('created', req.user._id, 'Form created and submitted');
    
    await form.save();
    await form.populate('submittedBy', 'username');
    
    console.log('Form saved successfully:', form._id);
    console.log('Attachments stored in database:', form.attachments.length);
    form.attachments.forEach((att, index) => {
      console.log(`Attachment ${index + 1}:`, {
        filename: att.filename,
        originalName: att.originalName,
        fileType: att.fileType,
        description: att.description,
        size: att.size
      });
    });
    
    res.status(201).json({ message: 'Form submitted successfully', form });
    
  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ 
      message: 'Server error during form submission', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

// Download/serve attachment files
router.get('/:id/attachments/:filename', authenticateToken, async (req, res) => {
  try {
    const { id, filename } = req.params;
    
    // Find the form and verify user has access
    const form = await Form.findById(id);
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Check permissions
    let hasAccess = false;
    
    switch (req.user.role) {
      case 'operator':
        hasAccess = form.submittedBy.toString() === req.user._id.toString();
        break;
      case 'supervisor':
        hasAccess = form.department === req.user.department;
        break;
      case 'admin':
        hasAccess = true;
        break;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Find the attachment
    const attachment = form.attachments.find(att => att.filename === filename);
    
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }
    
    // Check if file exists on disk
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', attachment.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(attachment.path);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Serve attachment files for viewing (inline)
router.get('/:id/attachments/:filename/view', authenticateToken, async (req, res) => {
  try {
    const { id, filename } = req.params;
    
    // Find the form and verify user has access
    const form = await Form.findById(id);
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Check permissions
    let hasAccess = false;
    
    switch (req.user.role) {
      case 'operator':
        hasAccess = form.submittedBy.toString() === req.user._id.toString();
        break;
      case 'supervisor':
        hasAccess = form.department === req.user.department;
        break;
      case 'admin':
        hasAccess = true;
        break;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Find the attachment
    const attachment = form.attachments.find(att => att.filename === filename);
    
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }
    
    // Check if file exists on disk
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Set appropriate headers for inline viewing
    res.setHeader('Content-Type', attachment.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(attachment.path);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('File view error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
