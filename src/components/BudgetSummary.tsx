import React from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import { useGameContext } from '../context/GameContext';

interface BudgetSummaryProps {
  showRemaining?: boolean;
  showTotal?: boolean;
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ 
  showRemaining = true, 
  showTotal = true 
}) => {
  const { state } = useGameContext();
  const { user } = state;
  
  const totalBudget = 14;
  const usedBudget = totalBudget - user.remainingBudget;
  const percentUsed = (usedBudget / totalBudget) * 100;
  
  // Determine color based on how much budget is used
  let progressColor = 'success.main';
  if (percentUsed > 75) {
    progressColor = 'error.main';
  } else if (percentUsed > 50) {
    progressColor = 'warning.main';
  }
  
  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Budget</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {showTotal && (
            <Typography>
              Total: <strong>{totalBudget} units</strong>
            </Typography>
          )}
          
          {showRemaining && (
            <Typography>
              Remaining: <strong>{user.remainingBudget} units</strong>
            </Typography>
          )}
          
          <Typography>
            Used: <strong>{usedBudget} units</strong>
          </Typography>
        </Box>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={percentUsed} 
        sx={{ 
          height: 10, 
          borderRadius: 5,
          backgroundColor: 'grey.300',
          '& .MuiLinearProgress-bar': {
            backgroundColor: progressColor
          }
        }} 
      />
    </Paper>
  );
};

export default BudgetSummary; 