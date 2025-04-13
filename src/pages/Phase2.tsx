import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  TextField, 
  IconButton,
  LinearProgress,
  Divider,
  Stack
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useGameContext } from '../context/GameContext';
import AgentMessage from '../components/AgentMessage';
import PolicySelectionCard from '../components/PolicySelectionCard';
import BudgetSummary from '../components/BudgetSummary';
import { generateOpeningStatement, generatePolicyResponse, generateConsensusMessage } from '../utils/agentResponses';

// Mock SpeechRecognition for demo purposes
const mockSpeechRecognition = {
  start: () => console.log('Speech recognition started'),
  stop: () => console.log('Speech recognition stopped'),
  onresult: null as any,
  onend: null as any
};

const Phase2: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { policyCategories, agents, user, groupDecisions } = state;
  
  // Chat state
  const [messages, setMessages] = useState<Array<{
    text: string;
    isUser: boolean;
    agentId?: number;
    isConsensus?: boolean;
  }>>([]);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(0);
  const [currentStep, setCurrentStep] = useState<'intro' | 'discussion' | 'voting' | 'results'>('intro');
  const [processingVotes, setProcessingVotes] = useState(false);
  
  // Reference to chat container for auto scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate the current category being discussed
  const category = policyCategories[currentCategory];
  
  // Keep track of votes for the current category
  const [votes, setVotes] = useState<Record<number, number>>({});
  
  // Add initial agent introductions
  useEffect(() => {
    if (currentStep === 'intro' && messages.length === 0) {
      // First add a system welcome message
      const welcomeMessage = {
        text: "Welcome to Phase II: Group Discussion & Consensus Building. You'll now discuss your policy choices with four AI agents representing different perspectives. For each policy category, you'll debate and then vote on a final decision.",
        isUser: false,
        isConsensus: true
      };
      
      // Add the welcome message
      setMessages([welcomeMessage]);
      
      // After a delay, add agent introductions
      setTimeout(() => {
        const introMessages = agents.map(agent => ({
          text: generateOpeningStatement(agent),
          isUser: false,
          agentId: agent.id
        }));
        
        setMessages(prevMessages => [...prevMessages, ...introMessages]);
        
        // Move to discussion step after introductions
        setTimeout(() => {
          setCurrentStep('discussion');
          
          // Add message about the first category
          const categoryIntroMessage = {
            text: `Let's begin our discussion with the first policy category: ${policyCategories[0].name}. What are your thoughts on this issue?`,
            isUser: false,
            isConsensus: true
          };
          
          setMessages(prevMessages => [...prevMessages, categoryIntroMessage]);
        }, 2000);
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, agents]);
  
  // Auto scroll to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Handle when all categories have been discussed
  useEffect(() => {
    if (currentCategory >= policyCategories.length && currentStep === 'results') {
      // Check if we've already calculated total budget
      const totalBudget = Object.keys(groupDecisions).reduce((total, catId) => {
        const category = policyCategories.find(cat => cat.id === Number(catId));
        const option = category?.options.find(opt => opt.id === groupDecisions[Number(catId)]);
        return total + (option?.cost || 0);
      }, 0);
      
      // Add a summary message
      const summaryMessage = {
        text: `We've completed our discussion of all policy categories. Our final decisions use ${totalBudget} of our 14 budget units. Thank you for your participation in this important dialogue about refugee education.`,
        isUser: false,
        isConsensus: true
      };
      
      setMessages(prevMessages => {
        // Only add if it doesn't already exist
        if (!prevMessages.some(msg => msg.text.includes("We've completed our discussion of all policy categories"))) {
          return [...prevMessages, summaryMessage];
        }
        return prevMessages;
      });
    }
  }, [currentCategory, currentStep, groupDecisions, policyCategories]);
  
  // Handle user message submission
  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    // Add user message
    const newUserMessage = {
      text: userInput,
      isUser: true
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserInput('');
    
    // If in discussion step, generate AI responses
    if (currentStep === 'discussion') {
      // After a short delay, have the agents respond
      setTimeout(() => {
        // For demo purposes, we'll have the agents respond to the user's policy choice
        const userChoice = user.policyChoices[category.id] || 0;
        
        if (userChoice) {
          const agentResponses = agents.map(agent => ({
            text: generatePolicyResponse(agent, category, userChoice),
            isUser: false,
            agentId: agent.id
          }));
          
          setMessages(prevMessages => [...prevMessages, ...agentResponses]);
          
          // After all agents have responded, move to voting
          setTimeout(() => {
            const votingMessage = {
              text: `Thank you for sharing your perspectives on ${category.name}. Let's now vote on our final decision for this category.`,
              isUser: false,
              isConsensus: true
            };
            
            setMessages(prevMessages => [...prevMessages, votingMessage]);
            setCurrentStep('voting');
          }, 1000);
        }
      }, 1000);
    }
  };
  
  // Handle voting process
  const handleVote = () => {
    setProcessingVotes(true);
    
    // Collect votes from user and all agents
    const newVotes: Record<number, number> = {};
    
    // User's vote
    const userChoice = user.policyChoices[category.id];
    if (userChoice) {
      newVotes[userChoice] = 1;
    }
    
    // Agent votes
    agents.forEach(agent => {
      const agentChoice = agent.policyChoices[category.id];
      if (agentChoice) {
        newVotes[agentChoice] = (newVotes[agentChoice] || 0) + 1;
      }
    });
    
    setVotes(newVotes);
    
    // Determine the winning option
    let maxVotes = 0;
    let winningOption = 0;
    
    Object.entries(newVotes).forEach(([option, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winningOption = Number(option);
      }
    });
    
    // In case of a tie, pick randomly from the tied options
    if (maxVotes > 0) {
      const tiedOptions = Object.entries(newVotes)
        .filter(([_, count]) => count === maxVotes)
        .map(([option]) => Number(option));
      
      if (tiedOptions.length > 1) {
        // Randomly pick from tied options
        winningOption = tiedOptions[Math.floor(Math.random() * tiedOptions.length)];
      }
    }
    
    // Add a short delay to simulate vote processing
    setTimeout(() => {
      setProcessingVotes(false);
      
      // Set the group decision
      if (winningOption > 0) {
        dispatch({
          type: 'SET_GROUP_DECISION',
          payload: { categoryId: category.id, optionId: winningOption }
        });
        
        // Get the winning option details
        const winningOptionDetails = category.options.find(opt => opt.id === winningOption);
        
        if (winningOptionDetails) {
          // Add consensus message
          const consensusMessage = {
            text: generateConsensusMessage(category.name, winningOptionDetails.title),
            isUser: false,
            isConsensus: true
          };
          
          setMessages(prevMessages => [...prevMessages, consensusMessage]);
          
          // Move to next category or finish
          setTimeout(() => {
            const nextCategory = currentCategory + 1;
            
            if (nextCategory < policyCategories.length) {
              setCurrentCategory(nextCategory);
              setCurrentStep('discussion');
              setVotes({});
              
              // Add message about the next category
              const nextCategoryMessage = {
                text: `Let's move on to the next policy category: ${policyCategories[nextCategory].name}. What are your thoughts on this issue?`,
                isUser: false,
                isConsensus: true
              };
              
              setMessages(prevMessages => [...prevMessages, nextCategoryMessage]);
            } else {
              // We've finished all categories
              setCurrentStep('results');
            }
          }, 1000);
        }
      }
    }, 1500);
  };
  
  // Handle voice input toggle
  const toggleVoiceInput = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      mockSpeechRecognition.stop();
    } else {
      // Start recording
      setIsRecording(true);
      mockSpeechRecognition.start();
      
      // Mock speech recognition result
      setTimeout(() => {
        setUserInput("I believe we should prioritize equal access to education and comprehensive support for refugee students, even if it means making tough choices in other areas.");
        setIsRecording(false);
      }, 2000);
    }
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };
  
  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle proceed to Phase 3
  const handleProceedToPhase3 = () => {
    dispatch({ type: 'SET_PHASE', payload: 'phase3' });
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" align="center" gutterBottom color="primary">
          Phase II: Group Discussion & Consensus Building
        </Typography>
        
        <Typography variant="h6" align="center" gutterBottom sx={{ mb: 4 }}>
          Discuss your policy choices with AI agents and reach consensus through voting.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Left panel: Policy options and budget */}
          <Box sx={{ width: '30%' }}>
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Policy Selections
              </Typography>
              
              <BudgetSummary showRemaining={false} />
              
              <Stack spacing={1}>
                {policyCategories.map(cat => {
                  const userChoice = user.policyChoices[cat.id];
                  const option = cat.options.find(opt => opt.id === userChoice);
                  
                  return (
                    <Box key={cat.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">{cat.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option && (
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {option.title}
                          </Typography>
                        )}
                        {groupDecisions[cat.id] === userChoice && (
                          <VerifiedIcon color="success" sx={{ ml: 1, fontSize: 16 }} />
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
            
            {currentStep === 'voting' && (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Vote on {category?.name}
                </Typography>
                
                {processingVotes ? (
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Tallying votes...
                    </Typography>
                    <LinearProgress />
                  </Box>
                ) : (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    onClick={handleVote}
                    sx={{ mt: 2 }}
                  >
                    Submit Votes
                  </Button>
                )}
              </Paper>
            )}
            
            {currentStep === 'results' && (
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                onClick={handleProceedToPhase3}
                sx={{ mt: 2 }}
              >
                Proceed to Phase III
              </Button>
            )}
          </Box>
          
          {/* Right panel: Chat interface */}
          <Box sx={{ width: '70%' }}>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
              {currentStep !== 'results' && category && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Currently Discussing: {category.name}
                  </Typography>
                  <Divider />
                </Box>
              )}
              
              {/* Chat messages container */}
              <Box 
                ref={chatContainerRef}
                sx={{ 
                  height: '400px', 
                  overflowY: 'auto', 
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {messages.map((message, index) => (
                  message.isUser ? (
                    <Box 
                      key={index}
                      sx={{ 
                        alignSelf: 'flex-end', 
                        backgroundColor: 'primary.main',
                        color: 'white',
                        p: 2,
                        borderRadius: '12px',
                        maxWidth: '80%',
                        mb: 2
                      }}
                    >
                      <Typography variant="body1">{message.text}</Typography>
                    </Box>
                  ) : message.isConsensus ? (
                    <Box 
                      key={index}
                      sx={{ 
                        alignSelf: 'center', 
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: '12px',
                        maxWidth: '90%',
                        mb: 3,
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {message.text}
                      </Typography>
                    </Box>
                  ) : (
                    <AgentMessage 
                      key={index}
                      agent={agents.find(a => a.id === message.agentId) || agents[0]}
                      message={message.text}
                    />
                  )
                ))}
              </Box>
              
              {/* Message input */}
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type your message here..."
                  value={userInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  multiline
                  maxRows={3}
                  disabled={currentStep === 'voting' || currentStep === 'results' || isRecording}
                />
                
                <IconButton 
                  color={isRecording ? 'secondary' : 'default'} 
                  onClick={toggleVoiceInput}
                  disabled={currentStep === 'voting' || currentStep === 'results'}
                  sx={{ ml: 1 }}
                >
                  <MicIcon />
                </IconButton>
                
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={!userInput || currentStep === 'voting' || currentStep === 'results'}
                  sx={{ ml: 1 }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Paper>
            
            {/* Display current category's voting results */}
            {currentStep === 'voting' && Object.keys(votes).length > 0 && (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Current Votes for {category?.name}
                </Typography>
                
                <PolicySelectionCard 
                  category={category}
                  disabled
                  showVotes
                  groupVote={groupDecisions[category.id]}
                  totalVotes={votes}
                />
              </Paper>
            )}
            
            {/* Display all finalized decisions */}
            {currentStep === 'results' && (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Final Group Decisions
                </Typography>
                
                {policyCategories.map(cat => {
                  const groupChoice = groupDecisions[cat.id];
                  const option = cat.options.find(opt => opt.id === groupChoice);
                  
                  return (
                    <Box key={cat.id} sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {cat.name}: {option?.title}
                      </Typography>
                      <Typography variant="body2">
                        {option?.description}
                      </Typography>
                    </Box>
                  );
                })}
              </Paper>
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Phase2; 