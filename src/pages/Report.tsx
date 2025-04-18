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
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import GetAppIcon from '@mui/icons-material/GetApp';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useGameContext } from '../context/GameContext';
import { reflectionQuestions } from '../data/reflectionData';
import { motion } from 'framer-motion';
import axios from 'axios';

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

// Get color based on quality score
const getQualityScoreColor = (score: number): string => {
  if (score >= 80) return '#4caf50'; // Green
  if (score >= 60) return '#2196f3'; // Blue
  if (score >= 40) return '#ff9800'; // Orange
  return '#f44336'; // Red
};

// Get text description based on quality score
const getQualityScoreText = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
};

const Report: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { policyCategories, user, groupDecisions, reflectionAnswers } = state;
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Calculate quality score
  const qualityScore = calculateQualityScore(groupDecisions);
  
  // Generate justice analysis
  const justiceAnalysis = generateJusticeAnalysis(qualityScore);
  
  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };
  
  // Generate report content for sending
  const generateReportContent = (): string => {
    // Basic report content formatting
    let report = "CHALLENGE GAME REPORT\n\n";
    
    // Participant info
    report += "PARTICIPANT INFORMATION\n";
    report += `Age: ${user.age || 'Not provided'}\n`;
    report += `Nationality: ${user.nationality || 'Not provided'}\n`;
    report += `Occupation: ${user.occupation || 'Not provided'}\n`;
    report += `Education: ${user.education || 'Not provided'}\n`;
    report += `Displacement Experience: ${user.displacementExperience || 'Not provided'}\n`;
    report += `Current Location: ${user.location || 'Not provided'}\n\n`;
    
    // Policy decisions
    report += "POLICY DECISIONS\n";
    policyCategories.forEach(category => {
      const decision = groupDecisions[category.id];
      const option = category.options.find(opt => opt.id === decision);
      if (option) {
        report += `${category.name}: ${option.title} (Option ${option.id}, ${option.cost} budget units)\n`;
        report += `${option.description}\n\n`;
      }
    });
    
    // Quality score and analysis
    report += `QUALITY SCORE: ${qualityScore}/100 - ${getQualityScoreText(qualityScore)}\n\n`;
    report += `JUSTICE ANALYSIS:\n${justiceAnalysis}\n\n`;
    
    // Reflections
    report += "REFLECTIONS\n";
    reflectionQuestions.forEach(question => {
      const answer = reflectionAnswers[question.id];
      report += `Q: ${question.question}\n`;
      report += `A: ${answer || 'No response provided'}\n\n`;
    });
    
    return report;
  };
  
  // Handle report email
  const handleEmailReport = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setIsSending(true);
    
    try {
      // Generate report content
      const reportContent = generateReportContent();
      
      // In a production environment, you would use a real email service API
      // For demo purposes, we're using a placeholder API call
      // Uncomment and modify this for actual implementation:
      
      /*
      const response = await axios.post('/api/send-email', {
        email: email,
        subject: 'Your CHALLENGE Game Report',
        content: reportContent
      });
      */
      
      // Simulate API call for the demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Send the report to the required email addresses
      console.log("Sending report to required recipients:");
      console.log("- aturan@asu.edu");
      console.log("- JANEL.WHITE@asu.edu");
      console.log("- User email:", email);
      console.log("Report content:", reportContent);
      
      // Mark as sent
      setEmailSent(true);
      setIsSending(false);
      
      // Alternatively, you could use the browser's mailto: functionality as a fallback
      // window.location.href = `mailto:${email}?subject=Your CHALLENGE Game Report&body=${encodeURIComponent(reportContent)}`;
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailError('Failed to send email. Please try again.');
      setIsSending(false);
    }
  };
  
  // Handle report download
  const handleDownloadReport = () => {
    // Generate report content
    const reportContent = generateReportContent();
    
    // Create a blob and download link
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CHALLENGE_Game_Report.txt';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
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
          
          {/* Enhanced Quality Score Section */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Paper 
              elevation={3} 
              sx={{ 
                mt: 3, 
                mb: 3, 
                p: 3, 
                bgcolor: 'rgba(0,0,0,0.02)', 
                borderRadius: 2,
                borderLeft: '6px solid',
                borderColor: getQualityScoreColor(qualityScore)
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3 }}>
                <Box sx={{ 
                  position: 'relative', 
                  width: 120, 
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={qualityScore} 
                    size={120}
                    thickness={5}
                    sx={{ 
                      color: getQualityScoreColor(qualityScore),
                      position: 'absolute'
                    }}
                  />
                  <Typography 
                    variant="h4" 
                    component="div"
                    sx={{ 
                      fontWeight: 'bold', 
                      color: getQualityScoreColor(qualityScore)
                    }}
                  >
                    {qualityScore}
                  </Typography>
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    Quality Score: {getQualityScoreText(qualityScore)}
                  </Typography>
                  <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                    This score reflects the degree to which your policy package prioritizes justice,
                    inclusion, and comprehensive support for refugee education.
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={qualityScore} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 2,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getQualityScoreColor(qualityScore)
                      }
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </motion.div>
          
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
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-end', mb: 2, gap: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              value={email}
              onChange={handleEmailChange}
              error={!!emailError}
              helperText={emailError}
              disabled={emailSent || isSending}
              placeholder="Enter your email to receive a copy"
            />
            
            <Button
              variant="contained"
              color="primary"
              startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
              onClick={handleEmailReport}
              disabled={emailSent || isSending || !email}
              sx={{ minWidth: '180px', height: '56px' }}
            >
              {isSending ? 'Sending...' : 'Send Report'}
            </Button>
          </Box>
          
          {emailSent && (
            <Alert 
              icon={<CheckCircleIcon fontSize="inherit" />}
              severity="success" 
              sx={{ mb: 2 }}
            >
              Report has been sent to <strong>{email}</strong> and the required recipients.
              <br />
              Thank you for participating in the CHALLENGE simulation!
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, flexWrap: 'wrap', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<GetAppIcon />}
              onClick={handleDownloadReport}
              size="large"
            >
              Download Report
            </Button>
            
            <Button
              variant="contained"
              color="secondary"
              startIcon={<RestartAltIcon />}
              onClick={handleRestartGame}
              size="large"
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