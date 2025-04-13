import React from 'react';
import { Box, Typography, Paper, Avatar, Chip } from '@mui/material';
import { Agent } from '../types';

interface AgentMessageProps {
  agent: Agent;
  message: string;
  alignRight?: boolean;
}

const AgentMessage: React.FC<AgentMessageProps> = ({ 
  agent, 
  message, 
  alignRight = false
}) => {
  // Generate a color based on the agent's political stance
  const getStanceColor = (stance: string) => {
    switch (stance.toLowerCase()) {
      case 'conservative':
        return '#0047AB'; // Cobalt Blue
      case 'liberal':
        return '#00BFFF'; // Deep Sky Blue
      case 'socialist':
        return '#DC143C'; // Crimson
      case 'moderate':
        return '#9370DB'; // Medium Purple
      default:
        return '#808080'; // Gray
    }
  };
  
  // Get initials for the avatar
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: alignRight ? 'row-reverse' : 'row',
        mb: 2,
        maxWidth: '80%',
        alignSelf: alignRight ? 'flex-end' : 'flex-start'
      }}
    >
      <Avatar
        sx={{
          bgcolor: getStanceColor(agent.politicalStance),
          width: 40,
          height: 40,
          mr: alignRight ? 0 : 2,
          ml: alignRight ? 2 : 0
        }}
      >
        {getInitials(agent.name)}
      </Avatar>
      
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, flexDirection: alignRight ? 'row-reverse' : 'row' }}>
          <Typography variant="subtitle2" sx={{ mr: alignRight ? 0 : 1, ml: alignRight ? 1 : 0, fontWeight: 'bold' }}>
            {agent.name}
          </Typography>
          
          <Chip 
            label={agent.politicalStance} 
            size="small"
            sx={{ 
              backgroundColor: getStanceColor(agent.politicalStance),
              color: 'white',
              fontSize: '0.7rem'
            }}
          />
        </Box>
        
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            borderRadius: '12px', 
            backgroundColor: alignRight ? 'primary.light' : 'grey.100',
            color: alignRight ? 'white' : 'inherit'
          }}
        >
          <Typography variant="body1">
            {message}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default AgentMessage; 