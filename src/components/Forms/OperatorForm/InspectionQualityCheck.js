import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Grid, 
  TextField, 
  Typography, 
  Paper, 
  Divider, 
  Button,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  RemoveRedEye as VisualInspectionIcon,
  List as ChecklistIcon
} from '@mui/icons-material';

const severityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const InspectionQualityCheck = () => {
  const { register, watch, setValue } = useFormContext();
  const [showDefectForm, setShowDefectForm] = useState(false);
  const [showChecklist, setShowChecklist] = useState([]);
  
  const visualInspection = watch('inspection.visualInspection');
  const measurements = watch('inspection.measurements') || [];
  const defects = watch('inspection.defects') || [];
  const qcChecklist = watch('inspection.qcChecklist') || [];

  // Toggle checklist item
  const toggleChecklistItem = (index) => {
    const updated = [...qcChecklist];
    updated[index].checked = !updated[index].checked;
    setValue('inspection.qcChecklist', updated);
  };

  // Add a new measurement
  const addMeasurement = () => {
    setValue('inspection.measurements', [
      ...measurements,
      { 
        parameter: '', 
        specification: '', 
        tolerance: '±0.0', 
        value: '', 
        unit: 'mm', 
        status: 'pending' 
      }
    ]);
  };

  // Remove a measurement
  const removeMeasurement = (index) => {
    const updated = [...measurements];
    updated.splice(index, 1);
    setValue('inspection.measurements', updated);
  };

  // Add a new defect
  const addDefect = () => {
    setValue('inspection.defects', [
      ...defects,
      { 
        description: '', 
        severity: 'medium', 
        location: '',
        actionTaken: '',
        status: 'open' 
      }
    ]);
  };

  // Remove a defect
  const removeDefect = (index) => {
    const updated = [...defects];
    updated.splice(index, 1);
    setValue('inspection.defects', updated);
  };

  // Add a new checklist item
  const addChecklistItem = () => {
    setValue('inspection.qcChecklist', [
      ...qcChecklist,
      { item: '', checked: false, comment: '' }
    ]);
  };

  // Remove a checklist item
  const removeChecklistItem = (index) => {
    const updated = [...qcChecklist];
    updated.splice(index, 1);
    setValue('inspection.qcChecklist', updated);
  };

  // Update measurement status
  const updateMeasurementStatus = (index, status) => {
    const updated = [...measurements];
    updated[index].status = status;
    setValue('inspection.measurements', updated);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        <CheckCircleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Inspection & Quality Check
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Visual Inspection */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          <VisualInspectionIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Visual Inspection
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <FormControlLabel
              control={
                <Checkbox
                  checked={visualInspection === 'pass'}
                  onChange={() => setValue('inspection.visualInspection', 'pass')}
                  color="success"
                />
              }
              label="Pass"
            />
          </Grid>
          <Grid item>
            <FormControlLabel
              control={
                <Checkbox
                  checked={visualInspection === 'fail'}
                  onChange={() => setValue('inspection.visualInspection', 'fail')}
                  color="error"
                />
              }
              label="Fail"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Visual Inspection Notes"
              {...register('inspection.visualInspectionNotes')}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Measurements */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1">Measurements</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<AddIcon />}
            onClick={addMeasurement}
          >
            Add Measurement
          </Button>
        </Box>
        
        {measurements.length > 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Parameter</TableCell>
                  <TableCell>Specification</TableCell>
                  <TableCell>Tolerance</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {measurements.map((measurement, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        size="small"
                        {...register(`inspection.measurements[${index}].parameter`)}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        {...register(`inspection.measurements[${index}].specification`)}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        {...register(`inspection.measurements[${index}].tolerance`)}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        {...register(`inspection.measurements[${index}].value`)}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        {...register(`inspection.measurements[${index}].unit`)}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => updateMeasurementStatus(index, 'pass')}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => updateMeasurementStatus(index, 'fail')}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => removeMeasurement(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Defects */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1">Defects</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<WarningIcon />}
            onClick={addDefect}
          >
            Add Defect
          </Button>
        </Box>
        
        {defects.length > 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Action Taken</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {defects.map((defect, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        size="small"
                        {...register(`inspection.defects[${index}].description`)}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        {...register(`inspection.defects[${index}].severity`)}
                        fullWidth
                        SelectProps={{
                          native: true,
                        }}
                      >
                        {severityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        {...register(`inspection.defects[${index}].location`)}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        {...register(`inspection.defects[${index}].actionTaken`)}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        {...register(`inspection.defects[${index}].status`)}
                        fullWidth
                        SelectProps={{
                          native: true,
                        }}
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => removeDefect(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* QC Checklist */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1">
            <ChecklistIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Quality Control Checklist
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<AddIcon />}
            onClick={addChecklistItem}
          >
            Add Item
          </Button>
        </Box>
        
        {qcChecklist.length > 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableBody>
                {qcChecklist.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell width={50}>
                      <Checkbox
                        checked={item.checked || false}
                        onChange={() => toggleChecklistItem(index)}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        {...register(`inspection.qcChecklist[${index}].item`)}
                        placeholder="Checklist item"
                      />
                      <TextField
                        fullWidth
                        size="small"
                        {...register(`inspection.qcChecklist[${index}].comment`)}
                        placeholder="Comment (optional)"
                        sx={{ mt: 1 }}
                      />
                    </TableCell>
                    <TableCell width={50}>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => removeChecklistItem(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Paper>
  );
};

export default InspectionQualityCheck;
