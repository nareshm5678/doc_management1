import React from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Grid, 
  TextField, 
  Typography, 
  Paper, 
  Divider,
  InputAdornment
} from '@mui/material';
import { Factory, QrCode, Tag, CalendarToday } from '@mui/icons-material';

const ProductMachineInfo = () => {
  const { register, formState: { errors } } = useFormContext();
  
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        <Factory sx={{ verticalAlign: 'middle', mr: 1 }} />
        Product & Machine Information
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Machine ID"
            placeholder="e.g., MCH-001, PRESS-A1 (Required)"
            {...register('productMachineInfo.machineId', { required: 'Machine ID is required' })}
            error={!!errors.productMachineInfo?.machineId}
            helperText={errors.productMachineInfo?.machineId?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <QrCode fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Machine Name"
            {...register('productMachineInfo.machineName')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Product Name"
            placeholder="e.g., Aluminum Component, Steel Part (Required)"
            {...register('productMachineInfo.productName', { required: 'Product name is required' })}
            error={!!errors.productMachineInfo?.productName}
            helperText={errors.productMachineInfo?.productName?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Tag fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Product Code"
            {...register('productMachineInfo.productCode')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Batch Number"
            placeholder="e.g., BATCH-20240720-001 (Required)"
            {...register('productMachineInfo.batchNumber', { required: 'Batch number is required' })}
            error={!!errors.productMachineInfo?.batchNumber}
            helperText={errors.productMachineInfo?.batchNumber?.message}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Lot Number"
            {...register('productMachineInfo.lotNumber')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Production Date"
            {...register('productMachineInfo.productionDate')}
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarToday fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Operator Name"
            {...register('productMachineInfo.operatorName', { required: 'Operator name is required' })}
            error={!!errors.productMachineInfo?.operatorName}
            helperText={errors.productMachineInfo?.operatorName?.message}
            placeholder="Enter operator name"
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProductMachineInfo;
