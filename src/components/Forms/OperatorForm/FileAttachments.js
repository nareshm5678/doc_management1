import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFormContext } from 'react-hook-form';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton,
  Button,
  Chip,
  TextField,
  MenuItem,
  LinearProgress,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  AttachFile as AttachFileIcon, 
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const fileTypes = [
  { value: 'image', label: 'Image' },
  { value: 'document', label: 'Document' },
  { value: 'pdf', label: 'PDF' },
  { value: 'spreadsheet', label: 'Spreadsheet' },
  { value: 'other', label: 'Other' },
];

const FileAttachments = () => {
  const { control, watch, setValue } = useFormContext();
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  
  const attachments = watch('attachments') || [];

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

  const onDrop = useCallback((acceptedFiles) => {
    const newAttachments = acceptedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      fileType: 'other',
      description: '',
      uploadedBy: 'currentUser', // This would be replaced with actual user info
      uploadDate: new Date().toISOString(),
      status: 'uploading',
      id: Math.random().toString(36).substr(2, 9)
    }));

    // Add new files to the form
    setValue('attachments', [...(attachments || []), ...newAttachments]);
    
    // Simulate upload progress
    newAttachments.forEach(attachment => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          clearInterval(interval);
          setUploadProgress(prev => ({
            ...prev,
            [attachment.id]: 100
          }));
          
          // Update status after upload completes
          setTimeout(() => {
            setValue('attachments', 
              (attachments || []).map(a => 
                a.id === attachment.id 
                  ? { ...a, status: 'uploaded' } 
                  : a
              )
            );
          }, 300);
        } else {
          setUploadProgress(prev => ({
            ...prev,
            [attachment.id]: progress
          }));
        }
      }, 100);
    });
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

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        <AttachFileIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        File Attachments
      </Typography>
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
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
          or click to browse files (max 10MB per file)
        </Typography>
        <Button variant="contained" color="primary">
          Select Files
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 2 }}>
          Supported formats: JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT
        </Typography>
      </Box>

      {/* File List */}
      {attachments.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Attached Files ({attachments.length})
          </Typography>
          
          <List>
            {attachments.map((file, index) => (
              <React.Fragment key={file.id || index}>
                <ListItem
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: 1
                    }
                  }}
                >
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
                            label="Uploading..."
                            size="small"
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        )}
                        
                        {file.status === 'uploaded' && (
                          <Chip
                            icon={<CheckCircleIcon fontSize="small" />}
                            label="Uploaded"
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
                          placeholder="Add a description"
                          value={file.description || ''}
                          onChange={(e) => updateFileMetadata(index, 'description', e.target.value)}
                          sx={{ flexGrow: 1 }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ ml: 2 }}>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        disabled={file.status === 'uploading'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
};

export default FileAttachments;
