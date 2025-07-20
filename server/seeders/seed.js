const mongoose = require('mongoose');
const User = require('../models/User');
const Template = require('../models/Template');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doc_management');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Template.deleteMany({});
    console.log('Cleared existing data');

    // Create default users
    const users = [
      {
        username: 'admin',
        email: 'admin@company.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        username: 'supervisor1',
        email: 'supervisor1@company.com',
        password: 'super123',
        role: 'supervisor',
        department: 'HR'
      },
      {
        username: 'supervisor2',
        email: 'supervisor2@company.com',
        password: 'super123',
        role: 'supervisor',
        department: 'IT'
      },
      {
        username: 'operator1',
        email: 'operator1@company.com',
        password: 'oper123',
        role: 'operator',
        department: 'HR'
      },
      {
        username: 'operator2',
        email: 'operator2@company.com',
        password: 'oper123',
        role: 'operator',
        department: 'IT'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save(); // triggers pre-save hook for password hashing
      createdUsers.push(user);
    }
    console.log('Created default users');

    // Find admin user for template creation
    const adminUser = createdUsers.find(user => user.role === 'admin');

    // Create default templates
    const templates = [
      {
        name: 'Employee Information Form',
        department: 'HR',
        description: 'Basic employee information collection form',
        fields: [
          {
            id: 'fullName',
            label: 'Full Name',
            type: 'text',
            required: true,
            placeholder: 'Enter full name'
          },
          {
            id: 'employeeId',
            label: 'Employee ID',
            type: 'text',
            required: true,
            placeholder: 'Enter employee ID'
          },
          {
            id: 'position',
            label: 'Position',
            type: 'text',
            required: true,
            placeholder: 'Enter position'
          },
          {
            id: 'startDate',
            label: 'Start Date',
            type: 'date',
            required: true
          },
          {
            id: 'comments',
            label: 'Additional Comments',
            type: 'textarea',
            required: false,
            placeholder: 'Any additional information...'
          }
        ],
        createdBy: adminUser._id
      },
      {
        name: 'IT Equipment Request',
        department: 'IT',
        description: 'Request form for IT equipment and software',
        fields: [
          {
            id: 'requestType',
            label: 'Request Type',
            type: 'select',
            required: true,
            options: ['Hardware', 'Software', 'Access Rights', 'Other']
          },
          {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            required: true,
            placeholder: 'Describe your request in detail...'
          },
          {
            id: 'urgency',
            label: 'Urgency Level',
            type: 'radio',
            required: true,
            options: ['Low', 'Medium', 'High', 'Critical']
          },
          {
            id: 'businessJustification',
            label: 'Business Justification',
            type: 'textarea',
            required: true,
            placeholder: 'Explain the business need...'
          },
          {
            id: 'estimatedCost',
            label: 'Estimated Cost',
            type: 'number',
            required: false,
            placeholder: 'Enter estimated cost if known'
          }
        ],
        createdBy: adminUser._id
      },
      {
        name: 'General Documentation Form',
        department: 'General',
        description: 'Generic form for various documentation needs',
        fields: [
          {
            id: 'title',
            label: 'Document Title',
            type: 'text',
            required: true,
            placeholder: 'Enter document title'
          },
          {
            id: 'category',
            label: 'Category',
            type: 'select',
            required: true,
            options: ['Policy', 'Procedure', 'Report', 'Request', 'Other']
          },
          {
            id: 'content',
            label: 'Content',
            type: 'textarea',
            required: true,
            placeholder: 'Enter document content...'
          },
          {
            id: 'attachments',
            label: 'Attachments',
            type: 'file',
            required: false
          },
          {
            id: 'reviewDate',
            label: 'Review Date',
            type: 'date',
            required: false
          }
        ],
        createdBy: adminUser._id
      }
    ];

    await Template.insertMany(templates);
    console.log('Created default templates');

    console.log('\n=== SEEDING COMPLETED ===');
    console.log('Default Login Credentials:');
    console.log('Admin: admin / admin123');
    console.log('Supervisor (HR): supervisor1 / super123');
    console.log('Supervisor (IT): supervisor2 / super123');
    console.log('Operator (HR): operator1 / oper123');
    console.log('Operator (IT): operator2 / oper123');
    console.log('========================\n');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
};

seedData();
