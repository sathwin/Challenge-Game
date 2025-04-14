import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  Alert, 
  Slide, 
  Fab, 
  Zoom,
  useScrollTrigger,
  Tooltip,
  LinearProgress
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { useGameContext } from '../context/GameContext';
import PolicySelectionCard from '../components/PolicySelectionCard';
import BudgetSummary from '../components/BudgetSummary';

const Phase1: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { policyCategories, user } = state;
  const [error, setError] = useState('');
  
  // Check if page has been scrolled to show the floating budget button
  const scrollTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 200,
  });
  
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
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Hide error when the user makes a change
  useEffect(() => {
    if (error) {
      setError('');
    }
  }, [user.policyChoices, error]);
  
  // Calculate budget info for floating display
  const totalBudget = 14;
  const usedBudget = totalBudget - user.remainingBudget;
  const percentUsed = (usedBudget / totalBudget) * 100;
  
  // Determine color based on how much budget is used
  let progressColor: 'success' | 'warning' | 'error' | 'primary' = 'success';
  if (percentUsed > 75) {
    progressColor = 'error';
  } else if (percentUsed > 50) {
    progressColor = 'warning';
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, pb: 8 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ 
          color: 'primary.light',
          textShadow: '0 0 10px rgba(139, 221, 255, 0.5)',
          letterSpacing: '0.05em',
          fontWeight: 'bold'
        }}>
          Phase I: Individual Decision Making
        </Typography>
        
        <Typography variant="h6" align="center" gutterBottom sx={{ mb: 4, color: 'text.secondary' }}>
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
            sx={{ 
              px: 4, 
              py: 1.5, 
              fontSize: '1.1rem',
              backgroundImage: 'linear-gradient(135deg, #1976d2, #2196f3)',
              boxShadow: '0 8px 16px rgba(33, 150, 243, 0.3)',
              '&:hover': {
                backgroundImage: 'linear-gradient(135deg, #1565c0, #1976d2)',
                boxShadow: '0 12px 20px rgba(33, 150, 243, 0.4)',
              }
            }}
          >
            Proceed to Phase II
          </Button>
        </Box>
      </Box>
      
      {/* Floating Budget Summary - Always visible when scrolled */}
      <Slide direction="up" in={scrollTrigger} mountOnEnter unmountOnExit>
        <Paper 
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            width: 260,
            p: 2,
            borderRadius: 2,
            zIndex: 1000,
            backgroundImage: 'linear-gradient(to bottom, rgba(30, 30, 50, 0.95), rgba(25, 25, 45, 0.97))',
            border: '1px solid rgba(100, 180, 255, 0.3)',
            boxShadow: '0 0 15px rgba(100, 180, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3)',
            fontFamily: '"Pixelify Sans", monospace',
          }}
        >
          <Typography 
            variant="h6" 
            align="center"
            sx={{ 
              fontSize: '1.4rem', 
              letterSpacing: '1px',
              color: 'white',
              textShadow: '0 0 5px rgba(100, 180, 255, 0.5)',
              mb: 1,
              fontFamily: 'inherit',
            }}
          >
            Budget Summary
          </Typography>
          
          <Box sx={{ 
            border: '1px solid rgba(100, 180, 255, 0.5)', 
            borderRadius: 1, 
            p: 2,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 1,
              boxShadow: 'inset 0 0 15px rgba(100, 180, 255, 0.2)',
              pointerEvents: 'none',
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontFamily: 'inherit', 
                    letterSpacing: '1px',
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '1.5rem',
                  }}
                >
                  Budget
                </Typography>
                <Typography 
                  sx={{ 
                    fontWeight: 'normal',
                    color: 'white', 
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                  }}
                >
                  {totalBudget} units
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography 
                  variant="subtitle1"
                  sx={{ 
                    color: 'white',
                    fontFamily: 'inherit',
                    fontSize: '1.1rem',
                  }}
                >
                  Remaining:
                </Typography>
                <Typography 
                  sx={{ 
                    color: 'white',
                    fontWeight: 'bold', 
                    fontFamily: 'inherit',
                    fontSize: '1.2rem',
                  }}
                >
                  {user.remainingBudget} units
                </Typography>
              </Box>
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={percentUsed} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                backgroundColor: 'rgba(50, 50, 70, 0.5)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: percentUsed > 75 ? '#ff5252' : 
                                   percentUsed > 50 ? '#ffab40' : 
                                   '#66bb6a',
                  boxShadow: '0 0 8px rgba(100, 255, 100, 0.5)'
                }
              }} 
            />
          </Box>
          
          <Button 
            onClick={scrollToTop} 
            sx={{ 
              width: '100%', 
              mt: 1.5,
              color: 'rgba(200, 230, 255, 0.9)',
              backgroundColor: 'rgba(50, 50, 70, 0.7)',
              border: '1px solid rgba(100, 180, 255, 0.3)',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              padding: '3px 0',
              '&:hover': {
                backgroundColor: 'rgba(70, 70, 100, 0.8)',
              }
            }}
          >
            View Budget Summary
          </Button>
        </Paper>
      </Slide>
    </Container>
  );
};

export default Phase1; 