import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Radio,
  RadioGroup,
  FormControlLabel,
  Collapse,
  IconButton,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { PolicyCategory, PolicyOption } from '../types';
import { useGameContext } from '../context/GameContext';

interface PolicySelectionCardProps {
  category: PolicyCategory;
  disabled?: boolean;
  showVotes?: boolean;
  groupVote?: number;
  totalVotes?: Record<number, number>;
}

const PolicySelectionCard: React.FC<PolicySelectionCardProps> = ({
  category,
  disabled = false,
  showVotes = false,
  groupVote,
  totalVotes = {}
}) => {
  const { state, dispatch } = useGameContext();
  const [expanded, setExpanded] = useState(false);
  
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  
  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const optionId = Number(event.target.value);
    dispatch({
      type: 'SELECT_POLICY_OPTION',
      payload: { categoryId: category.id, optionId }
    });
  };
  
  // Get user's current selection for this category
  const selectedOption = state.user.policyChoices[category.id];
  
  return (
    <Card elevation={3} sx={{ mb: 3, position: 'relative' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{category.name}</Typography>
            {groupVote && showVotes && (
              <Chip 
                color="primary" 
                label={`Group Decision: Option ${groupVote}`} 
                sx={{ ml: 2 }} 
              />
            )}
          </Box>
        }
        action={
          <IconButton onClick={handleExpandClick}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />
      
      <CardContent>
        <RadioGroup
          name={`policy-${category.id}`}
          value={selectedOption || ''}
          onChange={handleOptionChange}
        >
          {category.options.map(option => (
            <Box key={option.id} sx={{ mb: 1 }}>
              <FormControlLabel
                value={option.id}
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1">
                      {option.title}
                      <Chip 
                        size="small" 
                        label={`${option.cost} unit${option.cost > 1 ? 's' : ''}`} 
                        color={option.cost === 1 ? 'success' : option.cost === 2 ? 'warning' : 'error'}
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    {showVotes && totalVotes[option.id] && (
                      <Chip 
                        size="small" 
                        label={`${totalVotes[option.id]} vote${totalVotes[option.id] > 1 ? 's' : ''}`} 
                        variant="outlined"
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </Box>
                }
                disabled={disabled}
              />
            </Box>
          ))}
        </RadioGroup>
      </CardContent>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent>
          {category.options.map(option => (
            <Box key={option.id} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Option {option.id}: {option.title}
              </Typography>
              
              <Typography variant="body1" paragraph>
                {option.description}
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ThumbUpIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Advantages</Typography>
                      </Box>
                    }
                    secondary={option.advantages}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ThumbDownIcon color="error" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Disadvantages</Typography>
                      </Box>
                    }
                    secondary={option.disadvantages}
                  />
                </ListItem>
              </List>
            </Box>
          ))}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default PolicySelectionCard; 