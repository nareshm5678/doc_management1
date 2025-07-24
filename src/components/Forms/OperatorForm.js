import React, { useState, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Divider, 
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Snackbar,
  Alert,
  CircularProgress,
  Container,
  Grid,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import ProductMachineInfo from './OperatorForm/ProductMachineInfo';
import OperationalParameters from './OperatorForm/OperationalParameters';
import InspectionQualityCheck from './OperatorForm/InspectionQualityCheck';
import FileAttachments from './OperatorForm/FileAttachments';
import SignatureSection from './OperatorForm/SignatureSection';

const steps = [
  'Product & Machine Info',
  'Operational Parameters',
  'Inspection & Quality',
  'Attachments',
  'Sign-off'
];

const defaultValues = {
  title: 'Daily Production Log',
  description: '',
  department: 'manufacturing',
  template: 'production_log',
  status: 'draft',
  productMachineInfo: {
    machineId: '',
    machineName: '',
    productName: '',
    productCode: '',
    batchNumber: '',
    lotNumber: '',
    productionDate: format(new Date(), 'yyyy-MM-dd'),
    operatorId: null, // Will be set from auth context, null for now
    operatorName: 'Current User'   // This would be set from auth context
  },
  operationalParams: {
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: '',
    cycleTime: '',
    processingTime: 0,
    settings: {
      power: '',
      temperature: '',
      speed: '',
      pressure: '',
      humidity: ''
    },
    deviations: []
  },
  inspection: {
    visualInspection: '',
    visualInspectionNotes: '',
    measurements: [],
    defects: [],
    qcChecklist: []
  },
  attachments: [],
  location: {
    type: 'Point',
    coordinates: [0, 0],
    address: '',
    timestamp: null,
    accuracy: null
  },
  signature: {
    data: '',
    signerName: 'Current User', // Would come from auth
    signerTitle: 'Operator',     // Would come from user profile
    timestamp: null,
    location: '',
    ipAddress: '',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    isVerified: false,
    certified: false
  },
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'current_user_id',
    updatedBy: 'current_user_id',
    version: 1
  },
  isComplete: false
};

const OperatorForm = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();
  const formRef = useRef(null);
  
  const methods = useForm({
    defaultValues,
    mode: 'onChange',
    shouldFocusError: true
  });
  
  const { 
    handleSubmit, 
    trigger, 
    formState: { isDirty, isValid, errors },
    watch,
    setValue,
    reset
  } = methods;
  
  // Watch form values that affect other fields
  const signatureData = watch('signature.data');
  const currentStep = watch('currentStep', 0);
  
  // Update active step when currentStep changes
  React.useEffect(() => {
    setActiveStep(currentStep);
  }, [currentStep]);
  
  const validateCurrentStep = async (step) => {
    console.log('Validating step:', step);
    
    // Get all current form values
    const formValues = watch();
    console.log('Current form values:', formValues);
    
    let isValid = true;
    let errorMessage = '';
    
    // Define validation rules for each step
    switch (step) {
      case 0: // Product & Machine Info
        const productInfo = formValues.productMachineInfo || {};
        
        if (!productInfo.machineId || productInfo.machineId.trim() === '') {
          errorMessage = 'Machine ID is required';
          isValid = false;
        } else if (!productInfo.productName || productInfo.productName.trim() === '') {
          errorMessage = 'Product name is required';
          isValid = false;
        } else if (!productInfo.batchNumber || productInfo.batchNumber.trim() === '') {
          errorMessage = 'Batch number is required';
          isValid = false;
        } else if (!productInfo.operatorName || productInfo.operatorName.trim() === '') {
          errorMessage = 'Operator name is required';
          isValid = false;
        } else if (!productInfo.productionDate || productInfo.productionDate.trim() === '') {
          errorMessage = 'Production date is required';
          isValid = false;
        }
        break;
        
      case 1: // Operational Parameters
        const operationalParams = formValues.operationalParams || {};
        
        if (!operationalParams.startTime || operationalParams.startTime.trim() === '') {
          errorMessage = 'Start time is required';
          isValid = false;
        } else if (!operationalParams.endTime || operationalParams.endTime.trim() === '') {
          errorMessage = 'End time is required';
          isValid = false;
        } else if (!operationalParams.cycleTime || operationalParams.cycleTime === '') {
          errorMessage = 'Cycle time is required';
          isValid = false;
        }
        break;
        
      case 2: // Inspection & Quality
        const inspection = formValues.inspection || {};
        
        if (!inspection.visualInspection || inspection.visualInspection.trim() === '') {
          errorMessage = 'Visual inspection result is required';
          isValid = false;
        }
        break;
        
      case 3: // Attachments
        // Check if there are any files being uploaded
        const uploadStatus = formValues._uploadStatus || {};
        const attachments = formValues.attachments || [];
        
        if (attachments.length > 0) {
          // If there are attachments, all must be uploaded
          if (!uploadStatus.allUploadsComplete) {
            errorMessage = 'Please wait for all file uploads to complete before proceeding';
            isValid = false;
          }
        } else {
          // Attachments are optional, so no files is valid
          isValid = true;
        }
        break;
        
      case 4: // Sign-off
        const signature = formValues.signature || {};
        
        if (!signature.data || signature.data.trim() === '') {
          errorMessage = 'Signature is required';
          isValid = false;
        } else if (!signature.signerName || signature.signerName.trim() === '') {
          errorMessage = 'Please enter your name';
          isValid = false;
        } else if (!signature.certified) {
          errorMessage = 'Please check the certification checkbox to confirm the information is accurate';
          isValid = false;
        }
        break;
        
      default:
        isValid = true;
    }
    
    console.log('Validation result:', { step, isValid, errorMessage });
    
    // Show error message if validation failed
    if (!isValid && errorMessage) {
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
        autoHideDuration: 6000
      });
    }
    
    return isValid;
  };
  
  const handleNext = async () => {
    const isValid = await validateCurrentStep(activeStep);
    
    if (isValid) {
      // Update the current step in form data
      setValue('currentStep', Math.min(activeStep + 1, steps.length - 1));
      
      // Scroll to top of form
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      setSnackbar({
        open: true,
        message: 'Please complete all required fields before proceeding',
        severity: 'error',
        autoHideDuration: 6000
      });
    }
  };
  
  const submitForm = async (formData) => {
    try {
      setIsSubmitting(true);
      
      // Ensure we have the latest form data including signature
      const latestFormData = { ...formData };
      
      // Prepare form data for submission
      const formPayload = new FormData();
      
      // Add basic form data
      formPayload.append('status', 'submitted');
      formPayload.append('department', 'manufacturing');
      
      // Ensure signature data is properly formatted
      const signatureData = latestFormData.signature || {};
      if (!signatureData.timestamp) {
        signatureData.timestamp = new Date().toISOString();
      }
      
      // Prepare the form data object that matches the Form model
      const formDataObj = {
        productMachineInfo: latestFormData.productMachineInfo || {},
        operationalParams: latestFormData.operationalParams || {},
        inspection: latestFormData.inspection || {},
        location: latestFormData.location || { type: 'Point', coordinates: [0, 0] },
        // Map signature to signOff as expected by backend
        signOff: {
          operatorSignature: signatureData.data || '',
          operatorName: signatureData.signerName || latestFormData.productMachineInfo?.operatorName || 'Unknown User',
          submissionDate: signatureData.timestamp || new Date().toISOString(),
          ipAddress: signatureData.ipAddress || '',
          userAgent: signatureData.userAgent || navigator.userAgent
        },
        metadata: {
          ...(latestFormData.metadata || {}),
          deviceInfo: navigator.userAgent,
          submittedAt: new Date().toISOString(),
          formVersion: '1.0.0',
          submittedBy: latestFormData.productMachineInfo?.operatorId || null,
          submittedByName: latestFormData.productMachineInfo?.operatorName || 'Unknown User'
        },
        isComplete: true
      };
      
      // Validate required fields
      const requiredFields = {
        'productMachineInfo.machineId': formDataObj.productMachineInfo?.machineId,
        'productMachineInfo.productName': formDataObj.productMachineInfo?.productName,
        'productMachineInfo.batchNumber': formDataObj.productMachineInfo?.batchNumber
      };
      
      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value || value.trim() === '')
        .map(([key]) => key);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      console.log('Submitting form data:', formDataObj);
      
      // Add form data as JSON string
      formPayload.append('formData', JSON.stringify(formDataObj));
      
      // Add required fields for form creation
      formPayload.append('title', `Production Log - ${formDataObj.productMachineInfo?.productName || 'Unknown Product'} - ${new Date().toLocaleDateString()}`);
      formPayload.append('description', `Production log for batch ${formDataObj.productMachineInfo?.batchNumber || 'Unknown'} on machine ${formDataObj.productMachineInfo?.machineId || 'Unknown'}`);
      formPayload.append('template', 'operator_daily_log');
      
      // Process file attachments with metadata
      if (latestFormData.attachments && Array.isArray(latestFormData.attachments) && latestFormData.attachments.length > 0) {
        const attachmentMetadata = [];
        
        latestFormData.attachments.forEach((attachment, index) => {
          // Handle different file object structures
          let fileToUpload = null;
          
          if (attachment instanceof File) {
            fileToUpload = attachment;
          } else if (attachment.file instanceof File) {
            fileToUpload = attachment.file;
          } else if (attachment.originFileObj instanceof File) {
            fileToUpload = attachment.originFileObj;
          }
          
          if (fileToUpload) {
            // Append the actual file
            formPayload.append('attachments', fileToUpload);
            
            // Collect metadata for this file
            const fileMetadata = {
              originalName: fileToUpload.name,
              size: fileToUpload.size,
              type: fileToUpload.type,
              fileType: attachment.fileType || 'other',
              description: attachment.description || '',
              uploadedBy: attachment.uploadedBy || 'current_user',
              uploadDate: attachment.uploadDate || new Date().toISOString(),
              status: attachment.status || 'uploaded'
            };
            
            attachmentMetadata.push(fileMetadata);
            console.log('Appending file:', fileToUpload.name, 'Size:', fileToUpload.size, 'Metadata:', fileMetadata);
          } else {
            console.warn('Could not process attachment:', attachment);
          }
        });
        
        // Add attachment metadata as JSON string
        formPayload.append('attachmentMetadata', JSON.stringify(attachmentMetadata));
        console.log('Attachment metadata:', attachmentMetadata);
      }
      
      // Log the form data being sent (for debugging)
      for (let pair of formPayload.entries()) {
        console.log(pair[0] + ': ', pair[1]);
      }
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      // Check if user is authenticated
      if (!token) {
        throw new Error('Please log in to submit the form');
      }
      
      console.log('Submitting with token:', token ? 'Token present' : 'No token');
      
      // Submit to API
      const response = await fetch('/api/forms', {
        method: 'POST',
        body: formPayload,
        credentials: 'include', // Include cookies for authentication
        headers: {
          // Don't set Content-Type header - let the browser set it with the correct boundary
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      let responseData;
      try {
        // Try to parse JSON response
        responseData = await response.json();
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        console.error('Server error response:', responseData);
        
        // Handle validation errors
        if (responseData.validationErrors) {
          const errorMessages = responseData.validationErrors.map(err => `${err.field}: ${err.message}`).join('\n');
          throw new Error(`Validation failed:\n${errorMessages}`);
        }
        
        throw new Error(responseData.error || responseData.message || `Server responded with ${response.status}: ${response.statusText}`);
      }
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Form submitted successfully!',
        severity: 'success',
        autoHideDuration: 4000
      });
      
      // Reset form and redirect after a short delay
      setTimeout(() => {
        reset();
        navigate('/dashboard');
      }, 2000);
      
      return responseData;
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to submit form. Please try again.',
        severity: 'error',
        autoHideDuration: 6000
      });
      throw error; // Re-throw to be caught by the caller
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Final validation before submission
      const isFormValid = await validateCurrentStep(activeStep);
      
      if (!isFormValid) {
        setSnackbar({
          open: true,
          message: 'Please complete all required fields before submitting',
          severity: 'error',
          autoHideDuration: 6000
        });
        return;
      }
      
      // If this is the last step, submit the form
      if (activeStep === steps.length - 1) {
        // Get geolocation if available
        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
              });
            });
            
            // Update location data with geolocation
            data.location = {
              type: 'Point',
              coordinates: [position.coords.longitude, position.coords.latitude],
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            };
          } catch (error) {
            console.warn('Geolocation error:', error);
            // Continue with submission even if geolocation fails
          }
        }
        
        // Update timestamps
        const now = new Date().toISOString();
        data.metadata = data.metadata || {};
        data.metadata.updatedAt = now;
        data.metadata.updatedBy = 'current_user_id';
        data.isComplete = true;
        
        // Add signature timestamp if not already set
        if (data.signature && data.signature.data && !data.signature.timestamp) {
          data.signature.timestamp = now;
        }
        
        // Submit the form
        await submitForm(data);
        
      } else {
        // Move to the next step
        handleNext();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error submitting form. Please try again.',
        severity: 'error',
        autoHideDuration: 6000
      });
    }
  };

  const handleBack = () => {
    setValue('currentStep', Math.max(activeStep - 1, 0));
    
    // Scroll to top of form
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };
  
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return <ProductMachineInfo />;
      case 1:
        return <OperationalParameters />;
      case 2:
        return <InspectionQualityCheck />;
      case 3:
        return <FileAttachments />;
      case 4:
        return <SignatureSection />;
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <FormProvider {...methods}>
      <Container maxWidth="lg" sx={{ py: 4 }} ref={formRef}>
        <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Daily Production Log
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Please complete all required fields in each section. Required fields are marked with an asterisk (*).
          </Typography>
          
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel 
            sx={{ 
              mb: 4,
              '& .MuiStepLabel-label': {
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100px',
                display: 'block'
              }
            }}
          >
            {steps.map((label, index) => (
              <Step key={label} onClick={() => setActiveStep(index)} sx={{ cursor: 'pointer' }}>
                <StepLabel 
                  error={index < activeStep && 
                    Object.keys(errors).some(key => 
                      key.startsWith(steps[index].toLowerCase().replace(/\s+/g, '').split('&')[0])
                    )
                  }
                >
                  {isMobile ? label.split(' ').pop() : label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {/* Current Step Content */}
          <Box sx={{ minHeight: '50vh' }}>
            {renderStepContent(activeStep)}
          </Box>
          
          {/* Navigation Buttons */}
          <Box 
            sx={{ 
              mt: 4, 
              pt: 3, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              display: 'flex',
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              gap: 2,
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0 || isSubmitting}
              startIcon={<ArrowBackIcon />}
              fullWidth={isMobile}
              sx={{ minWidth: isMobile ? '100%' : 120 }}
            >
              Back
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2, width: isMobile ? '100%' : 'auto' }}>
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                  fullWidth={isMobile}
                  sx={{ minWidth: isMobile ? '100%' : 150 }}
                >
                  Next: {steps[activeStep + 1]}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                  fullWidth={isMobile}
                  sx={{ minWidth: isMobile ? '100%' : 180 }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Form'}
                </Button>
              )}
              
              {activeStep < steps.length - 1 && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  startIcon={<SaveIcon />}
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  Save Draft
                </Button>
              )}
            </Box>
          </Box>
          
          {/* Form Status */}
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Typography variant="caption" color="textSecondary">
              {Object.keys(errors).length > 0 && (
                <Box component="span" display="flex" alignItems="center" color="error.main">
                  <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Please check required fields
                </Box>
              )}
            </Typography>
          </Box>
        </Paper>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={snackbar.autoHideDuration || 6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </FormProvider>
  );
};

export default OperatorForm;
