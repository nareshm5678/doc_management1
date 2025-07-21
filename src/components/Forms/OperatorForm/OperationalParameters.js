import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Grid, 
  TextField, 
  Typography, 
  Paper, 
  Divider, 
  Button,
  IconButton,
  Box,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
  Whatshot as TemperatureIcon,
  Power as PowerIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const OperationalParameters = () => {
  const { register, watch, setValue } = useFormContext();
  const [showDeviations, setShowDeviations] = useState(false);
  
  const startTime = watch('operationalParams.startTime');
  const endTime = watch('operationalParams.endTime');
  const deviations = watch('operationalParams.deviations') || [];

  // Calculate processing time when start or end time changes
  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffInMinutes = Math.round((end - start) / (1000 * 60));
      if (!isNaN(diffInMinutes) && diffInMinutes > 0) {
        setValue('operationalParams.processingTime', diffInMinutes);
      }
    }
  }, [startTime, endTime, setValue]);

  const addDeviation = () => {
    setValue('operationalParams.deviations', [
      ...deviations,
      { parameter: '', expected: '', actual: '', reason: '', actionTaken: '' }
    ]);
  };

  const removeDeviation = (index) => {
    const updated = [...deviations];
    updated.splice(index, 1);
    setValue('operationalParams.deviations', updated);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        <SpeedIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Operational Parameters
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Start Time"
            {...register('operationalParams.startTime')}
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ScheduleIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="datetime-local"
            label="End Time"
            {...register('operationalParams.endTime')}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label="Cycle Time (minutes)"
            {...register('operationalParams.cycleTime')}
            InputProps={{
              endAdornment: <InputAdornment position="end">min</InputAdornment>,
              startAdornment: (
                <InputAdornment position="start">
                  <TimerIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label="Processing Time (minutes)"
            {...register('operationalParams.processingTime')}
            disabled
            InputProps={{
              endAdornment: <InputAdornment position="end">min</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label="Power Setting"
            {...register('operationalParams.settings.power')}
            InputProps={{
              endAdornment: <InputAdornment position="end">kW</InputAdornment>,
              startAdornment: (
                <InputAdornment position="start">
                  <PowerIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Temperature"
            {...register('operationalParams.settings.temperature')}
            InputProps={{
              endAdornment: <InputAdornment position="end">°C</InputAdornment>,
              startAdornment: (
                <InputAdornment position="start">
                  <TemperatureIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Speed"
            {...register('operationalParams.settings.speed')}
            InputProps={{
              endAdornment: <InputAdornment position="end">rpm</InputAdornment>,
              startAdornment: (
                <InputAdornment position="start">
                  <SpeedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Button 
            variant="outlined" 
            startIcon={showDeviations ? <DeleteIcon /> : <WarningIcon />}
            onClick={() => setShowDeviations(!showDeviations)}
            color={showDeviations ? 'error' : 'primary'}
            sx={{ mb: 2 }}
          >
            {showDeviations ? 'Hide Deviations' : 'Add Deviation'}
          </Button>
          
          {showDeviations && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Record any deviations from standard process:
              </Typography>
              
              {deviations.map((_, index) => (
                <Box 
                  key={index} 
                  border={1} 
                  p={2} 
                  mb={2} 
                  borderRadius={1} 
                  borderColor="divider"
                  sx={{ backgroundColor: 'rgba(255, 0, 0, 0.02)' }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Parameter"
                        {...register(`operationalParams.deviations[${index}].parameter`)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Expected"
                        {...register(`operationalParams.deviations[${index}].expected`)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Actual"
                        {...register(`operationalParams.deviations[${index}].actual`)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Reason"
                        {...register(`operationalParams.deviations[${index}].reason`)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton 
                        color="error" 
                        onClick={() => removeDeviation(index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Action Taken"
                        {...register(`operationalParams.deviations[${index}].actionTaken`)}
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
              
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={addDeviation}
                size="small"
                sx={{ mt: 1 }}
              >
                Add Another Deviation
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default OperationalParameters;
