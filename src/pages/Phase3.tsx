import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  TextField, 
  Stepper, 
  Step, 
  StepLabel,
  StepContent,
  Card,
  CardContent
} from '@mui/material';
import { useGameContext } from '../context/GameContext';
import { reflectionQuestions } from '../data/reflectionData';

const Phase3: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const [activeStep, setActiveStep] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  // Get current question
  const currentQuestion = reflectionQuestions[activeStep];
  
  // Handle next step
  const handleNext = () => {
    if (currentAnswer.trim()) {
      // Save the answer
      dispatch({
        type: 'SAVE_REFLECTION_ANSWER',
        payload: {
          questionId: currentQuestion.id,
          answer: currentAnswer
        }
      });
      
      // If this is the last question, go to the report
      if (activeStep === reflectionQuestions.length - 1) {
        dispatch({ type: 'SET_PHASE', payload: 'report' });
      } else {
        // Otherwise go to the next question
        setActiveStep(prevStep => prevStep + 1);
        setCurrentAnswer('');
      }
    }
  };
  
  // Handle previous step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
    // Load the previously saved answer
    const previousAnswer = state.reflectionAnswers[reflectionQuestions[activeStep - 1].id] || '';
    setCurrentAnswer(previousAnswer);
  };
  
  // Handle text change
  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentAnswer(e.target.value);
  };
  
  // Skip to report
  const handleSkipToReport = () => {
    dispatch({ type: 'SET_PHASE', payload: 'report' });
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" align="center" gutterBottom color="primary">
          Phase III: Reflection
        </Typography>
        
        <Typography variant="h6" align="center" gutterBottom sx={{ mb: 4 }}>
          Reflect on your experience and decisions in the previous phases.
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="body1" paragraph>
            Now that you've completed the group decision-making process, take some time to reflect on your experience. 
            The following questions are designed to help you critically examine your assumptions, emotions, and choices 
            during the simulation.
          </Typography>
          
          <Typography variant="body1" paragraph>
            Your reflections will be included in the final evaluation report and will provide valuable insights 
            into the ethical and practical dimensions of refugee education policymaking. Please be honest and thoughtful 
            in your responses.
          </Typography>
          
          <Box sx={{ mt: 4 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {reflectionQuestions.map((question, index) => (
                <Step key={question.id}>
                  <StepLabel>
                    <Typography variant="subtitle1">
                      Question {index + 1}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="body1" paragraph>
                          {question.question}
                        </Typography>
                      </CardContent>
                    </Card>
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      variant="outlined"
                      placeholder="Enter your response..."
                      value={currentAnswer}
                      onChange={handleAnswerChange}
                      sx={{ mb: 2 }}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                      >
                        Back
                      </Button>
                      
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleNext}
                        disabled={!currentAnswer.trim()}
                      >
                        {activeStep === reflectionQuestions.length - 1 ? 'Finish' : 'Next'}
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="text"
              color="primary"
              onClick={handleSkipToReport}
            >
              Skip to Final Report
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Phase3; 