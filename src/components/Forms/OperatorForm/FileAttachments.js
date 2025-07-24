import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFormContext } from 'react-hook-form';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card,
  CardContent,
  CardActions,
  IconButton,
  Button,
  Chip,
  TextField,
  MenuItem,
  LinearProgress,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Add as AddIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';

const fileTypes = [
  { value: 'image', label: 'Image', color: '#4caf50' },
  { value: 'document', label: 'Document', color: '#2196f3' },
  { value: 'pdf', label: 'PDF', color: '#f44336' },
  { value: 'spreadsheet', label: 'Spreadsheet', color: '#ff9800' },
  { value: 'other', label: 'Other', color: '#9e9e9e' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;
const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'text/csv',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const FileAttachments = () => {
  const { watch, setValue } = useFormContext();
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [previewDialog, setPreviewDialog] = useState({ open: false, file: null });
  const [dragActive, setDragActive] = useState(false);

  // Get attachments from form context
  const attachments = watch('attachments') || [];
  
  // Initialize attachments array if not present
  useEffect(() => {
    if (!Array.isArray(attachments)) {
      setValue('attachments', []);
    }
  }, [attachments, setValue]);

  // Debug logging
  useEffect(() => {
    console.log('FileAttachments - Current attachments:', attachments);
  }, [attachments]);
  
  // Helper function to check if all uploads are complete
  const areAllUploadsComplete = () => {
    if (!Array.isArray(attachments)) return true;
    return attachments.every(file => file.status === 'uploaded');
  };
  
  // Helper function to get upload summary
  const getUploadSummary = () => {
    if (!Array.isArray(attachments)) {
      return { uploading: 0, uploaded: 0, total: 0 };
    }
    const uploading = attachments.filter(file => file.status === 'uploading').length;
    const uploaded = attachments.filter(file => file.status === 'uploaded').length;
    const total = attachments.length;
    return { uploading, uploaded, total };
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon />;
      case 'pdf':
        return <PdfIcon />;
      case 'document':
        return <DescriptionIcon />;
      default:
        return <FileIcon />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to determine file type
  const determineFileType = (file) => {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    
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

  const onDrop = useCallback((acceptedFiles) => {
    // Check file limits
    if (attachments.length + acceptedFiles.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed. You can only add ${MAX_FILES - attachments.length} more files.`);
      return;
    }

    const newAttachments = acceptedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      fileType: determineFileType(file),
      description: '',
      uploadedBy: 'currentUser',
      uploadDate: new Date().toISOString(),
      status: 'uploaded', // Set as uploaded for server compatibility
      id: Math.random().toString(36).substr(2, 9)
    }));

    // Add new files to the form
    const currentAttachments = Array.isArray(attachments) ? attachments : [];
    const updatedAttachments = [...currentAttachments, ...newAttachments];
    setValue('attachments', updatedAttachments);
    
    console.log('Files added to attachments:', newAttachments.map(f => ({ name: f.name, size: f.size, type: f.fileType })));
  }, [attachments, setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (index) => {
    const updated = [...attachments];
    updated.splice(index, 1);
    setValue('attachments', updated);
  };

  const updateFileMetadata = (index, field, value) => {
    if (!Array.isArray(attachments)) return;
    const updated = [...attachments];
    updated[index] = { ...updated[index], [field]: value };
    setValue('attachments', updated);
  };

  const renderFilePreview = (file) => {
    if (file.type.startsWith('image/')) {
      return (
        <Box
          component="img"
          src={URL.createObjectURL(file.file)}
          alt={file.name}
          sx={{
            width: 50,
            height: 50,
            objectFit: 'cover',
            borderRadius: 1,
            mr: 2
          }}
        />
      );
    }
    return (
      <Box
        sx={{
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          borderRadius: 1,
          mr: 2
        }}
      >
        {getFileIcon(file.fileType)}
      </Box>
    );
  };

  // Export upload status to parent form for validation
  React.useEffect(() => {
    // Add a custom property to the form data to track upload status
    setValue('_uploadStatus', {
      allUploadsComplete: areAllUploadsComplete(),
      summary: getUploadSummary()
    });
  }, [attachments, setValue]);

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        <AttachFileIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        File Attachments
      </Typography>
      
      {/* Upload Status Summary */}
      {Array.isArray(attachments) && attachments.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {(() => {
              const { uploading, uploaded, total } = getUploadSummary();
              if (uploading > 0) {
                return `Uploading ${uploading} of ${total} files... Please wait for all uploads to complete before submitting.`;
              } else if (uploaded === total && total > 0) {
                return `All ${total} files uploaded successfully. You can now proceed to submit the form.`;
              } else {
                return `${uploaded} of ${total} files uploaded.`;
              }
            })()} 
          </Typography>
          {!areAllUploadsComplete() && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="caption" color="warning.main">
                Form submission will be disabled until all files are uploaded
              </Typography>
            </Box>
          )}
          {/* Show ready files summary */}
          {(() => {
            const uploadedFiles = attachments.filter(file => file.status === 'uploaded');
            if (uploadedFiles.length > 0) {
              return (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                    Files Ready for Submission:
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {uploadedFiles.map((file, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          bgcolor: 'success.light', 
                          color: 'success.contrastText', 
                          px: 1.5, 
                          py: 0.8, 
                          borderRadius: 1,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          border: '1px solid',
                          borderColor: 'success.main'
                        }}
                      >
                        <CheckCircleIcon fontSize="small" />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>
                            {file.name}
                          </Typography>
                          {file.description && (
                            <Typography variant="caption" sx={{ opacity: 0.8, color: 'success.contrastText' }}>
                              {file.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            }
            return null;
          })()} 
        </Box>
      )}
      
      {attachments.length === 0 && (
        <Box mt={2} mb={2} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            No attachments added yet.
          </Typography>
        </Box>
      )}
      
      <Divider sx={{ mb: 3 }} />

      {/* Dropzone */}
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 1,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease',
          mb: 3
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon 
          color={isDragActive ? 'primary' : 'action'} 
          sx={{ fontSize: 48, mb: 1 }} 
        />
        <Typography variant="h6">
          {isDragActive ? 'Drop files here to upload' : 'Drag & drop files here to upload'}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
          or click to browse and select files (maximum 10MB per file)
        </Typography>
        <Button variant="contained" color="primary">
          Select Files
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 2 }}>
          Supported file formats: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX), Text (TXT)
        </Typography>
      </Box>

      {/* File List */}
      {Array.isArray(attachments) && attachments.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachFileIcon color="primary" />
            Attached Files ({attachments.length})
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Manage your file attachments. You can edit descriptions or remove files as needed.
          </Typography>
          
          <Grid container spacing={2}>
            {attachments.map((file, index) => (
              <Grid item xs={12} sm={6} md={4} key={file.id || file.name + index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" width="100%">
                    {file.file && renderFilePreview(file)}
                    
                    <Box flexGrow={1} minWidth={0}>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <Tooltip title={file.name}>
                          <Typography 
                            variant="subtitle2" 
                            noWrap 
                            sx={{ 
                              maxWidth: 200,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden'
                            }}
                          >
                            {file.name}
                          </Typography>
                        </Tooltip>
                        
                        <Chip
                          label={formatFileSize(file.size)}
                          size="small"
                          sx={{ ml: 1, fontSize: '0.7rem' }}
                        />
                        
                        {file.status === 'uploading' && (
                          <Chip
                            icon={<CircularProgress size={14} />}
                            label={`Uploading... ${Math.round(uploadProgress[file.id] || 0)}%`}
                            size="small"
                            color="info"
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        )}
                        
                        {file.status === 'uploaded' && (
                          <Chip
                            icon={<CheckCircleIcon fontSize="small" />}
                            label="Successfully Uploaded"
                            color="success"
                            size="small"
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        )}
                        
                        {uploadErrors[file.id] && (
                          <Chip
                            icon={<ErrorIcon fontSize="small" />}
                            label="Error"
                            color="error"
                            size="small"
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                      
                      {file.status === 'uploading' && (
                        <Box sx={{ width: '100%', mb: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={uploadProgress[file.id] || 0} 
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      )}
                      
                      <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
                        <TextField
                          select
                          size="small"
                          label="File Type"
                          value={file.fileType || 'other'}
                          onChange={(e) => updateFileMetadata(index, 'fileType', e.target.value)}
                          sx={{ minWidth: 150 }}
                        >
                          {fileTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </TextField>
                        
                        <TextField
                          size="small"
                          label="Description"
                          placeholder="Add a description for this file (optional)"
                          value={file.description || ''}
                          onChange={(e) => updateFileMetadata(index, 'description', e.target.value)}
                          sx={{ flexGrow: 1 }}
                          helperText="Describe the purpose or content of this file"
                          multiline
                          rows={2}
                          inputProps={{ maxLength: 500 }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Tooltip title="Remove this file">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to remove "${file.name}"?`)) {
                              removeFile(index);
                            }
                          }}
                          disabled={file.status === 'uploading'}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'error.contrastText'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {file.status === 'uploaded' && (
                        <Tooltip title="File successfully uploaded">
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default FileAttachments;
