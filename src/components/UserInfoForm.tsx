import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container, 
  Paper, 
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel
} from '@mui/material';
import { useGameContext } from '../context/GameContext';

const UserInfoForm: React.FC = () => {
  const { dispatch } = useGameContext();
  const [formData, setFormData] = useState({
    age: '',
    nationality: '',
    occupation: '',
    education: '',
    displacementExperience: 'No',
    location: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.nationality) newErrors.nationality = 'Nationality is required';
    if (!formData.occupation) newErrors.occupation = 'Occupation is required';
    if (!formData.education) newErrors.education = 'Education is required';
    if (!formData.location) newErrors.location = 'Current location is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Update user info in the state
      dispatch({ 
        type: 'UPDATE_USER_INFO', 
        payload: formData 
      });
      
      // Move to the next phase
      dispatch({ type: 'SET_PHASE', payload: 'phase1' });
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom color="primary">
          Participant Information
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 4 }}>
          Please provide the following information to help us understand your perspective.
          This information will be included in the final evaluation report.
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            margin="normal"
            label="Age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            error={!!errors.age}
            helperText={errors.age}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Nationality"
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            error={!!errors.nationality}
            helperText={errors.nationality}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Occupation"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            error={!!errors.occupation}
            helperText={errors.occupation}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Highest Educational Level"
            name="education"
            value={formData.education}
            onChange={handleChange}
            error={!!errors.education}
            helperText={errors.education}
            sx={{ mb: 2 }}
          />
          
          <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
            <FormLabel component="legend">Do you have any displacement experience?</FormLabel>
            <RadioGroup
              row
              name="displacementExperience"
              value={formData.displacementExperience}
              onChange={handleChange}
            >
              <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="No" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
          
          <TextField
            fullWidth
            margin="normal"
            label="Current Location (City, Country)"
            name="location"
            value={formData.location}
            onChange={handleChange}
            error={!!errors.location}
            helperText={errors.location}
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              Continue to Phase I
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserInfoForm;