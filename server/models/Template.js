const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  fields: [{
    id: String,
    label: String,
    type: {
      type: String,
      enum: ['text', 'textarea', 'number', 'date', 'select', 'checkbox', 'radio', 'file']
    },
    required: Boolean,
    options: [String], // For select, checkbox, radio
    placeholder: String,
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      message: String
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Template', templateSchema);
