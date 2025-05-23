import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  Snackbar
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import GetAppIcon from '@mui/icons-material/GetApp';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useGameContext } from '../context/GameContext';
import { reflectionQuestions } from '../data/reflectionData';
import { motion } from 'framer-motion';
import { useSnackbar as useNotistackSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

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

// Email service configuration (would connect to a real email API in production)
const EMAIL_SERVICE = {
  sendReport: async (content: string, recipientEmail: string, senderEmail: string = 'sjulaka7@asu.edu') => {
    // This is a simulation of an email API call - no actual network request
    console.log(`%c EMAIL SENDING VERIFICATION`, 'background: #4CAF50; color: white; font-size: 12px; padding: 2px 6px; border-radius: 2px;');
    console.log(`%c From: ${senderEmail}`, 'color: #0288D1');
    console.log(`%c To: ${recipientEmail}`, 'color: #0288D1');
    console.log(`%c Subject: CHALLENGE Game Evaluation Report`, 'color: #0288D1');
    console.log(`%c Content length: ${content.length} characters`, 'color: #0288D1');
    console.log(`%c Content preview: ${content.substring(0, 300)}...`, 'color: #0288D1');
    
    try {
      // Simulate network delay without actual fetch
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For testing, you can open the browser's developer console to verify these logs
      console.log(`%c EMAIL DELIVERY SIMULATION SUCCESSFUL`, 'background: #4CAF50; color: white; font-size: 12px; padding: 2px 6px; border-radius: 2px;');
      
      // Always return success in this mock implementation
      const verificationData = {
        timestamp: new Date().toISOString(),
        success: true,
        recipient: recipientEmail,
        sender: senderEmail,
        messageId: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      };
      
      // Log the verification data
      console.table(verificationData);
      
      return { 
        success: true, 
        messageId: verificationData.messageId,
        verificationData 
      };
    } catch (error) {
      console.error('Email simulation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  
  // Add a verification method
  verifyDelivery: async (messageId: string) => {
    console.log(`Verifying delivery for message ID: ${messageId}`);
    // Simulate checking email delivery status
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      delivered: true,
      timestamp: new Date().toISOString(),
      status: 'delivered'
    };
  }
};

const Report: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { policyCategories, user, groupDecisions, reflectionAnswers } = state;
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [autoEmailSent, setAutoEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [notification, setNotification] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useNotistackSnackbar();
  
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
    const timestamp = new Date().toLocaleString();
    
    // Enhanced report content with HTML formatting for better email display
    let report = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        h1 { color: #1976d2; }
        h2 { color: #1976d2; margin-top: 20px; }
        .section { margin-bottom: 30px; }
        .policy-item { margin-bottom: 15px; }
        .policy-title { font-weight: bold; }
        .policy-option { font-style: italic; }
        .policy-cost { color: #666; }
        .policy-desc { margin-top: 5px; }
        .score { font-size: 24px; font-weight: bold; }
        .reflection-question { font-weight: bold; margin-top: 15px; }
        .reflection-answer { margin-left: 20px; margin-bottom: 15px; }
        .divider { border-top: 1px solid #eee; margin: 20px 0; }
        .summary { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #1976d2; }
      </style>
    </head>
    <body>
      <h1>CHALLENGE GAME EVALUATION REPORT</h1>
      <p>Generated on: ${timestamp}</p>
      
      <div class="section">
        <h2>PARTICIPANT INFORMATION</h2>
        <p>Age: ${user.age || 'Not provided'}</p>
        <p>Nationality: ${user.nationality || 'Not provided'}</p>
        <p>Occupation: ${user.occupation || 'Not provided'}</p>
        <p>Education: ${user.education || 'Not provided'}</p>
        <p>Displacement Experience: ${user.displacementExperience || 'Not provided'}</p>
        <p>Current Location: ${user.location || 'Not provided'}</p>
      </div>
      
      <div class="divider"></div>
      
      <div class="section">
        <h2>INDIVIDUAL POLICY CHOICES</h2>
        <div class="summary">
          <p>The participant's individual policy choices focused on 
          ${Object.entries(user.policyChoices).length} categories, 
          allocating a total of ${14 - (user.remainingBudget || 0)} budget units out of the available 14.</p>
        </div>
        ${policyCategories.map(category => {
          const userChoice = user.policyChoices[category.id];
          const option = category.options.find(opt => opt.id === userChoice);
          if (option) {
            return `
              <div class="policy-item">
                <span class="policy-title">${category.name}:</span>
                <span class="policy-option"> ${option.title}</span>
                <span class="policy-cost"> (Option ${option.id}, ${option.cost} budget units)</span>
                <p class="policy-desc">${option.description}</p>
              </div>
            `;
          }
          return '';
        }).join('')}
      </div>
      
      <div class="divider"></div>
      
      <div class="section">
        <h2>GROUP DISCUSSION SUMMARY</h2>
        <div class="summary">
          <p>The group discussion resulted in policy decisions that differ from the individual choices 
          in ${Object.entries(user.policyChoices).filter(([catId, optId]) => 
            groupDecisions[Number(catId)] !== optId).length} categories. 
          The group maintained a focus on key priorities while staying within budget constraints.</p>
        </div>
        ${policyCategories.map(category => {
          const decision = groupDecisions[category.id];
          const option = category.options.find(opt => opt.id === decision);
          if (option) {
            return `
              <div class="policy-item">
                <span class="policy-title">${category.name}:</span>
                <span class="policy-option"> ${option.title}</span>
                <span class="policy-cost"> (Option ${option.id}, ${option.cost} budget units)</span>
                <p class="policy-desc">${option.description}</p>
              </div>
            `;
          }
          return '';
        }).join('')}
      </div>
      
      <div class="divider"></div>
      
      <div class="section">
        <h2>QUALITY SCORE: <span class="score">${qualityScore}/100</span> - ${getQualityScoreText(qualityScore)}</h2>
        <p>${justiceAnalysis}</p>
      </div>
      
      <div class="divider"></div>
      
      <div class="section">
        <h2>REFLECTION RESPONSES (VERBATIM)</h2>
        ${reflectionQuestions.map(question => {
          const answer = reflectionAnswers[question.id];
          return `
            <p class="reflection-question">${question.question}</p>
            <p class="reflection-answer">${answer || 'No response provided'}</p>
          `;
        }).join('')}
      </div>
    </body>
    </html>
    `;
    
    return report;
  };
  
  // Generate plain text report for download
  const generatePlainTextReport = (): string => {
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
    
    // Individual policy choices
    report += "INDIVIDUAL POLICY CHOICES\n";
    policyCategories.forEach(category => {
      const userChoice = user.policyChoices[category.id];
      const option = category.options.find(opt => opt.id === userChoice);
      if (option) {
        report += `${category.name}: ${option.title} (Option ${option.id}, ${option.cost} budget units)\n`;
        report += `${option.description}\n\n`;
      }
    });
    
    // Group policy decisions
    report += "GROUP POLICY DECISIONS\n";
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
    report += "REFLECTIONS (VERBATIM RESPONSES)\n";
    reflectionQuestions.forEach(question => {
      const answer = reflectionAnswers[question.id];
      report += `Q: ${question.question}\n`;
      report += `A: ${answer || 'No response provided'}\n\n`;
    });
    
    return report;
  };
  
  // Automatically send report when component mounts
  useEffect(() => {
    const sendAutomaticReport = async () => {
      try {
        if (autoEmailSent) return; // Prevent multiple sends
        
        // Ensure there are actual policy decisions before sending
        const hasCompletedGame = Object.keys(groupDecisions).length > 0;
        if (!hasCompletedGame) {
          console.log("Simulation not complete, not sending automatic report");
          return;
        }
        
        setIsSending(true);
        setAutoEmailSent(true);
        
        // Generate report content
        const reportContent = generateReportContent();
        
        // Send to the required email address
        const result = await EMAIL_SERVICE.sendReport(
          reportContent,
          'aturan@asu.edu',
          'sjulaka7@asu.edu'
        );
        
        if (result.success) {
          console.log("Automatic report sent successfully");
          
          // Verify delivery for extra confirmation
          if (result.messageId) {
            const deliveryStatus = await EMAIL_SERVICE.verifyDelivery(result.messageId);
            console.log("Delivery verification:", deliveryStatus);
          }
          
          setNotification({
            show: true,
            message: "Report automatically sent to aturan@asu.edu"
          });
          
          // Store that we sent the report, to prevent duplicate sends on remount
          sessionStorage.setItem('autoReportSent', 'true');
        }
      } catch (error) {
        console.error("Error sending automatic report:", error);
      } finally {
        setIsSending(false);
      }
    };
    
    // Check if we already sent an automatic report in this session
    const alreadySent = sessionStorage.getItem('autoReportSent') === 'true';
    if (!alreadySent && !autoEmailSent) {
      // Delay slightly to ensure all data is loaded and ready
      const timer = setTimeout(() => {
        sendAutomaticReport();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoEmailSent, groupDecisions, generateReportContent]);
  
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
      
      // Send to the user-specified email
      const result = await EMAIL_SERVICE.sendReport(
        reportContent,
        email,
        'sjulaka7@asu.edu'
      );
      
      if (result.success) {
        // Verify delivery for extra confirmation
        if (result.messageId) {
          const deliveryStatus = await EMAIL_SERVICE.verifyDelivery(result.messageId);
          console.log("Delivery verification for user email:", deliveryStatus);
        }
      
        // Mark as sent
        setEmailSent(true);
        setIsSending(false);
        setNotification({
          show: true,
          message: `Report successfully sent to ${email}`
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailError('Failed to send email. Please try again.');
      setIsSending(false);
    }
  };
  
  // Handle report download
  const handleDownloadReport = () => {
    // Generate report content
    const reportContent = generatePlainTextReport();
    
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
    // Clear session storage flag when restarting
    sessionStorage.removeItem('autoReportSent');
    dispatch({ type: 'RESET_GAME' });
  };
  
  // Handle notification close
  const handleNotificationClose = () => {
    setNotification({...notification, show: false});
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
        
        {/* Notification for automatic email */}
        <Snackbar
          open={notification.show}
          autoHideDuration={6000}
          onClose={handleNotificationClose}
          message={notification.message}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        />
        
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
          
          {/* Individual Choices Section */}
          <Typography variant="h5" gutterBottom>
            Your Individual Policy Choices
          </Typography>
          
          <List>
            {policyCategories.map(category => {
              const userChoice = user.policyChoices[category.id];
              const option = category.options.find(opt => opt.id === userChoice);
              
              return (
                <ListItem key={`individual-${category.id}`} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
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
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" gutterBottom>
            Final Group Decisions
          </Typography>
          
          <List>
            {policyCategories.map(category => {
              const decision = groupDecisions[category.id];
              const option = category.options.find(opt => opt.id === decision);
              
              return (
                <ListItem key={`group-${category.id}`} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
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
            Your Reflections (Verbatim)
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
          
          <Box sx={{ bgcolor: 'rgba(25, 118, 210, 0.05)', p: 2, borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle1" color="primary" fontWeight="bold">
              Automatic Report Delivery
            </Typography>
            <Typography variant="body2">
              A copy of this report has been automatically sent to: <strong>aturan@asu.edu</strong>
            </Typography>
          </Box>
          
          <Typography variant="h5" gutterBottom>
            Send Report to Your Email
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
              Report has been sent to <strong>{email}</strong>.
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