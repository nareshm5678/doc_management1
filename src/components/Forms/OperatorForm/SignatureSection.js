import React, { useRef, useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Button, 
  TextField,
  Grid,
  IconButton,
  InputAdornment,
  Checkbox,
  Tooltip
} from '@mui/material';
import { 
  Edit as EditIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Today as TodayIcon,
  LocationOn as LocationIcon,
  Computer as ComputerIcon
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';

const SignatureSection = () => {
  const { control, watch, setValue, formState: { errors } } = useFormContext();
  const signatureRef = useRef(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [location, setLocation] = useState('');
  
  // Get current signature data from form
  const currentSignature = watch('signature.data');
  const currentSignerName = watch('signature.signerName');
  const currentSignerTitle = watch('signature.signerTitle');
  const currentLocation = watch('signature.location');
  const currentTimestamp = watch('signature.timestamp');
  const certifyChecked = watch('signature.certified') || false;
  
  // Initialize form values
  useEffect(() => {
    if (currentSignature) setSignatureData(currentSignature);
    if (currentSignerName) setSignerName(currentSignerName);
    if (currentSignerTitle) setSignerTitle(currentSignerTitle);
    if (currentLocation) setLocation(currentLocation);
    
    // Try to get geolocation if not already set
    if (!currentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setValue('signature.location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          
          // Optionally, you could reverse geocode to get address
          // This would require a geocoding service like Google Maps Geocoding API
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to IP-based location or leave empty
        }
      );
    }
    
    // Set current timestamp if not already set
    if (!currentTimestamp) {
      setValue('signature.timestamp', new Date().toISOString());
    }
  }, [currentSignature, currentSignerName, currentSignerTitle, currentLocation, currentTimestamp, setValue]);
  
  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignatureData('');
      setValue('signature.data', '');
    }
  };
  
  const handleUndo = () => {
    if (signatureRef.current) {
      const data = signatureRef.current.toData();
      if (data && data.length > 0) {
        data.pop(); // Remove the last line
        signatureRef.current.fromData(data);
      }
    }
  };
  
  const handleRedo = () => {
    // Note: This is a simplified implementation
    // In a real app, you'd need to maintain a redo stack
    console.log('Redo functionality would be implemented here');
  };
  
  const handleSaveSignature = () => {
    if (signatureRef.current) {
      const signatureUrl = signatureRef.current.toDataURL('image/png');
      setSignatureData(signatureUrl);
      // Ensure all signature data is saved to the form
      setValue('signature', {
        ...watch('signature'),
        data: signatureUrl,
        signerName: signerName,
        signerTitle: signerTitle,
        timestamp: new Date().toISOString(),
        isVerified: true
      }, { shouldValidate: true });
      setIsSigning(false);
    }
  };
  
  const startSigning = () => {
    setIsSigning(true);
  };
  
  const cancelSigning = () => {
    if (signatureData) {
      // Restore previous signature if it existed
      if (signatureRef.current && currentSignature) {
        signatureRef.current.fromDataURL(currentSignature);
      }
    } else {
      // Clear the canvas if there was no previous signature
      if (signatureRef.current) {
        signatureRef.current.clear();
      }
    }
    setIsSigning(false);
  };
  
  const handleLocationChange = (e) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    setValue('signature.location', newLocation);
  };
  
  // Format the timestamp for display
  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString();
  };
  
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Operator Sign-off
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Digital Signature
            </Typography>
            
            {!isSigning ? (
              <Box
                sx={{
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
                onClick={startSigning}
              >
                {signatureData ? (
                  <>
                    <Box
                      component="img"
                      src={signatureData}
                      alt="Signature"
                      sx={{ 
                        maxWidth: '100%',
                        maxHeight: 150,
                        objectFit: 'contain',
                        mb: 2
                      }}
                    />
                    <Typography variant="body2" color="textSecondary">
                      Click to edit signature
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body1" color="textSecondary" gutterBottom>
                      No signature provided
                    </Typography>
                    <Button variant="outlined" startIcon={<EditIcon />}>
                      Sign Here
                    </Button>
                  </>
                )}
              </Box>
            ) : (
              <Box>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    mb: 2,
                    overflow: 'hidden'
                  }}
                >
                  <SignatureCanvas
                    ref={signatureRef}
                    penColor="black"
                    canvasProps={{
                      width: '100%',
                      height: 200,
                      className: 'signature-canvas',
                      style: { 
                        backgroundColor: 'white',
                        cursor: 'crosshair'
                      }
                    }}
                    onEnd={() => {
                      // Optional: Auto-save on end of drawing
                      // const signatureUrl = signatureRef.current.toDataURL('image/png');
                      // setSignatureData(signatureUrl);
                    }}
                  />
                </Box>
                
                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                  <Tooltip title="Clear">
                    <IconButton onClick={handleClear} size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Undo">
                    <span>
                      <IconButton 
                        onClick={handleUndo} 
                        size="small"
                        disabled={!signatureRef.current || !signatureRef.current.toData().length}
                      >
                        <UndoIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Tooltip title="Redo">
                    <span>
                      <IconButton 
                        onClick={handleRedo} 
                        size="small"
                        disabled={true} // Disabled as redo functionality is not fully implemented
                      >
                        <RedoIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Box flexGrow={1} />
                  
                  <Button 
                    onClick={cancelSigning}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  
                  <Button 
                    variant="contained" 
                    onClick={handleSaveSignature}
                    size="small"
                    startIcon={<CheckIcon />}
                    disabled={!signatureRef.current || signatureRef.current.isEmpty()}
                  >
                    Save Signature
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                required
                disabled={!isSigning && !!signatureData}
                error={!!errors.signature?.signerName}
                helperText={errors.signature?.signerName?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title/Role"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                disabled={!isSigning && !!signatureData}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={location}
                onChange={handleLocationChange}
                disabled={!isSigning && !!signatureData}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            border: '1px solid', 
            borderColor: 'divider',
            borderRadius: 1,
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Submission Details
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" display="flex" alignItems="center" mb={1}>
                  <TodayIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                  <span>Submission Date & Time:</span>
                </Typography>
                <Typography variant="body1">
                  {formatTimestamp(currentTimestamp) || 'Not submitted yet'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" display="flex" alignItems="center" mb={1}>
                  <LocationIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                  <span>Location:</span>
                </Typography>
                <Typography variant="body1">
                  {location || 'Not specified'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" display="flex" alignItems="center" mb={1}>
                  <ComputerIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                  <span>Device Information:</span>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {navigator.userAgent.split('(')[1].split(')')[0]}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                By signing, you confirm that all information provided is accurate and complete to the best of your knowledge.
              </Typography>
              
              <Box display="flex" alignItems="center" mt={1}>
                <Checkbox
                  id="certifyCheckbox"
                  size="small"
                  checked={certifyChecked}
                  onChange={(e) => setValue('signature.certified', e.target.checked)}
                  disabled={!isSigning && !!signatureData}
                />
                <Typography variant="body2" component="label" htmlFor="certifyCheckbox">
                  I certify that the information provided is accurate and complete.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SignatureSection;
