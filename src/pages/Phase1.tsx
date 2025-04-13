import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, Paper, Alert } from '@mui/material';
import { useGameContext } from '../context/GameContext';
import PolicySelectionCard from '../components/PolicySelectionCard';
import BudgetSummary from '../components/BudgetSummary';

const Phase1: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { policyCategories, user } = state;
  const [error, setError] = useState('');
  
  // Check if all categories have a selection
  const hasSelectedAllCategories = policyCategories.every(
    category => user.policyChoices[category.id]
  );
  
  const handleProceed = () => {
    if (!hasSelectedAllCategories) {
      setError('Please select an option for all policy categories.');
      return;
    }
    
    // Initialize AI agent choices
    dispatch({ type: 'INITIALIZE_AI_CHOICES' });
    
    // Proceed to Phase 2
    dispatch({ type: 'SET_PHASE', payload: 'phase2' });
  };
  
  // Hide error when the user makes a change
  useEffect(() => {
    if (error) {
      setError('');
    }
  }, [user.policyChoices, error]);
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" align="center" gutterBottom color="primary">
          Phase I: Individual Decision Making
        </Typography>
        
        <Typography variant="h6" align="center" gutterBottom sx={{ mb: 4 }}>
          Select one policy option for each category within your budget constraint of 14 units.
        </Typography>
        
        <BudgetSummary />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {policyCategories.map(category => (
          <PolicySelectionCard key={category.id} category={category} />
        ))}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleProceed}
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
          >
            Proceed to Phase II
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Phase1; 