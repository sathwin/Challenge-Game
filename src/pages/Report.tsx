import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import GetAppIcon from '@mui/icons-material/GetApp';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useGameContext } from '../context/GameContext';
import { reflectionQuestions } from '../data/reflectionData';

// Helper function to generate a quality score based on policy choices
const calculateQualityScore = (groupDecisions: Record<number, number>): number => {
  // A simple algorithm: more inclusive options (typically option 3) get more points
  let total = 0;
  let count = 0;
  
  Object.entries(groupDecisions).forEach(([_, optionId]) => {
    total += optionId;
    count++;
  });
  
  // Score from 0-100
  // If all option 1s: (7 * 1) / (7 * 3) * 100 = 33.3
  // If all option 3s: (7 * 3) / (7 * 3) * 100 = 100
  return Math.round((total / (count * 3)) * 100);
};

// Generate the justice and inclusion analysis
const generateJusticeAnalysis = (score: number): string => {
  if (score >= 80) {
    return "The policy package strongly prioritizes justice and inclusion. The choices made reflect a commitment to transformative education that centers refugee needs and rights. These decisions may be more resource-intensive but will likely lead to better long-term integration and educational outcomes.";
  } else if (score >= 60) {
    return "The policy package demonstrates a good balance between inclusion and pragmatic constraints. While not fully transformative, these choices reflect meaningful steps toward more equitable refugee education. Additional support mechanisms may be needed to address remaining gaps.";
  } else if (score >= 40) {
    return "The policy package takes moderate steps toward inclusion but may not adequately address the structural barriers refugees face. The choices reflect a cautious approach that could benefit from more ambitious measures in areas of greatest impact, such as language instruction and psychosocial support.";
  } else {
    return "The policy package prioritizes minimal changes to existing systems, which may perpetuate educational inequities for refugee students. While fiscally conservative, these choices may lead to higher long-term social costs due to limited integration and educational attainment.";
  }
};

const Report: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { policyCategories, user, groupDecisions, reflectionAnswers } = state;
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // Calculate quality score
  const qualityScore = calculateQualityScore(groupDecisions);
  
  // Generate justice analysis
  const justiceAnalysis = generateJusticeAnalysis(qualityScore);
  
  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };
  
  // Handle report email
  const handleEmailReport = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Simulate sending email
    setEmailSent(true);
    
    // In a real implementation, you would send the report to the server
    console.log(`Sending report to ${email}`);
    console.log(`Report for participant`);
  };
  
  // Handle report download
  const handleDownloadReport = () => {
    // In a real implementation, you would generate a PDF or text file
    console.log('Downloading report...');
  };
  
  // Handle restart game
  const handleRestartGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" align="center" gutterBottom color="primary">
          Final Evaluation Report
        </Typography>
        
        <Typography variant="h6" align="center" gutterBottom sx={{ mb: 4 }}>
          Your journey through the CHALLENGE simulation is complete. Here's your final report.
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Participant Information
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Age" 
                secondary={user.age || 'Not provided'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Nationality" 
                secondary={user.nationality || 'Not provided'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Occupation" 
                secondary={user.occupation || 'Not provided'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Education" 
                secondary={user.education || 'Not provided'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Displacement Experience" 
                secondary={user.displacementExperience || 'Not provided'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Current Location" 
                secondary={user.location || 'Not provided'} 
              />
            </ListItem>
          </List>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" gutterBottom>
            Final Policy Decisions
          </Typography>
          
          <List>
            {policyCategories.map(category => {
              const decision = groupDecisions[category.id];
              const option = category.options.find(opt => opt.id === decision);
              
              return (
                <ListItem key={category.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {category.name}
                        </Typography>
                        {option && (
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            (Option {option.id}, {option.cost} budget units)
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={option?.title}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {option?.description}
                  </Typography>
                </ListItem>
              );
            })}
          </List>
          
          <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Quality Score: {qualityScore}/100
            </Typography>
            <Typography variant="body2">
              This score reflects the degree to which your policy package prioritizes justice,
              inclusion, and comprehensive support for refugee education.
            </Typography>
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Justice and Inclusion Analysis
          </Typography>
          
          <Typography variant="body1" paragraph>
            {justiceAnalysis}
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" gutterBottom>
            Your Reflections
          </Typography>
          
          {reflectionQuestions.map(question => {
            const answer = reflectionAnswers[question.id];
            
            return (
              <Accordion key={question.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    {question.question.length > 100 
                      ? question.question.substring(0, 100) + '...' 
                      : question.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1">
                    {answer || 'No response provided'}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            );
          })}
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" gutterBottom>
            Share Your Report
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              value={email}
              onChange={handleEmailChange}
              error={!!emailError}
              helperText={emailError}
              disabled={emailSent}
              sx={{ mr: 2 }}
            />
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<EmailIcon />}
              onClick={handleEmailReport}
              disabled={emailSent}
            >
              Send Report
            </Button>
          </Box>
          
          {emailSent && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Report has been sent to {email}. Thank you for participating in the CHALLENGE simulation!
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<GetAppIcon />}
              onClick={handleDownloadReport}
            >
              Download Report
            </Button>
            
            <Button
              variant="contained"
              color="secondary"
              startIcon={<RestartAltIcon />}
              onClick={handleRestartGame}
            >
              Start New Simulation
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Report; 