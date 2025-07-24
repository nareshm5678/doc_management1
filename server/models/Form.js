const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  department: {
    type: String,
    required: true
  },
  template: {
    type: String,
    required: true
  },
  
  // Product/Machine Identification
  productMachineInfo: {
    machineId: { type: String, required: true },
    machineName: { type: String },
    productName: { type: String, required: true },
    productCode: { type: String },
    batchNumber: { type: String, required: true },
    lotNumber: { type: String },
    productionDate: { type: Date, default: Date.now },
    operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    operatorName: { type: String }
  },

  // Operational Parameters
  operationalParams: {
    startTime: { type: Date },
    endTime: { type: Date },
    cycleTime: { type: Number }, // in minutes
    processingTime: { type: Number }, // in minutes
    settings: {
      power: { type: Number },
      temperature: { type: Number },
      speed: { type: Number },
      // Add other settings as needed
    },
    deviations: [{
      parameter: String,
      expected: String,
      actual: String,
      reason: String,
      actionTaken: String
    }]
  },

  // Inspection & Quality Check
  inspection: {
    visualInspection: { type: String, enum: ['pass', 'fail', 'hold'] },
    measurements: [{
      name: String,
      value: Number,
      unit: String,
      minTolerance: Number,
      maxTolerance: Number,
      status: { type: String, enum: ['pass', 'fail', 'na'] }
    }],
    defects: [{
      type: { type: String, required: true },
      description: String,
      severity: { type: String, enum: ['minor', 'major', 'critical'] },
      location: String,
      actionTaken: String
    }],
    qcChecklist: [{
      item: String,
      status: { type: String, enum: ['pass', 'fail', 'na'] },
      notes: String
    }]
  },

  // Form Data (kept for backward compatibility)
  formData: {
    type: mongoose.Schema.Types.Mixed,
    required: false // Made optional as we're moving to structured data
  },
  // Supporting Files
  attachments: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    fileType: { type: String, enum: ['image', 'pdf', 'document', 'other'], default: 'other' },
    description: String,
    uploadedBy: String, // Store username or user identifier
    uploadDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['uploading', 'uploaded', 'failed'], default: 'uploaded' },
    uploadedAt: { type: Date, default: Date.now } // Keep for backward compatibility
  }],
  
  // Geo-location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'approved', 'rejected', 'disapproved'],
    default: 'draft'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Sign-off Information
  signOff: {
    operatorSignature: {
      type: String, // Could be a base64 encoded signature image or just the name
      required: true
    },
    operatorName: {
      type: String,
      required: true
    },
    submissionDate: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  },

  // Comments and Communication
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  auditLog: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }]
}, {
  timestamps: true
});

// Add audit log entry
formSchema.methods.addAuditLog = function(action, performedBy, details = '') {
  this.auditLog.push({
    action,
    performedBy,
    details,
    timestamp: new Date()
  });
};

module.exports = mongoose.model('Form', formSchema);
