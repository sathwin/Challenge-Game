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
  Stack,
  Card,
  CardContent,
  useTheme,
  Grid,
  Avatar,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import VerifiedIcon from '@mui/icons-material/Verified';
import GroupsIcon from '@mui/icons-material/Groups';
import ChatIcon from '@mui/icons-material/Chat';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useGameContext } from '../context/GameContext';
import AgentMessage from '../components/AgentMessage';
import PolicySelectionCard from '../components/PolicySelectionCard';
import BudgetSummary from '../components/BudgetSummary';
import { generateOpeningStatement, generatePolicyResponse, generateConsensusMessage, generateAIPolicyResponse, generateAIOpeningStatement, generateAIConsensusMessage } from '../utils/agentResponses';
import { getAIResponse } from '../utils/aiService';
import { PolicyCategory } from '../types';

// Mock SpeechRecognition for demo purposes
const mockSpeechRecognition = {
  start: () => console.log('Speech recognition started'),
  stop: () => console.log('Speech recognition stopped'),
  onresult: null as any,
  onend: null as any
};

interface MessageType {
  id: number;
  text: string;
  sender: string;
  isUser: boolean;
  avatar?: string;
  timestamp: number;
}

const Phase2: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { policyCategories, agents, user, groupDecisions } = state;
  const theme = useTheme();
  
  // States for discussion flow
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [userInput, setUserInput] = useState('');
  const [currentCategory, setCurrentCategory] = useState<number>(0);
  const [discussionStep, setDiscussionStep] = useState<'intro' | 'agentIntrosComplete' | 'discussing' | 'voting' | 'complete'>('intro');
  const [categoryVoting, setCategoryVoting] = useState<PolicyCategory | undefined>(undefined);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [userVote, setUserVote] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [processingVotes, setProcessingVotes] = useState(false);
  const [processingResponse, setProcessingResponse] = useState(false);
  
  // Ref for auto-scrolling to latest message
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Current step in Phase 2
  const [currentStep, setCurrentStep] = useState<'intro' | 'discussion' | 'voting' | 'results'>('intro');
  
  // Calculate the current category being discussed
  const category = policyCategories[currentCategory];
  
  // Add initial agent introductions
  useEffect(() => {
    if (currentStep === 'intro' && chatContainerRef.current) {
      // Clear existing localStorage and sessionStorage
      localStorage.removeItem('discussionInitialized');
      localStorage.removeItem('introCompleted');
      sessionStorage.clear();
      
      // Set a flag to check if introductions are completed
      const introCompleted = localStorage.getItem('introCompleted');
      
      if (introCompleted) {
        // If intros are done, move to discussion phase
        setDiscussionStep('agentIntrosComplete');
        setCurrentStep('discussion');
        return;
      }
      
      // Mark introductions as completed to prevent duplication
      localStorage.setItem('introCompleted', 'true');
      
      const initializeDiscussion = async () => {
        // Clear all existing messages
        setMessages([]);
        
        // Create a single message array to avoid state update issues
        const initialMessages: MessageType[] = [];
        
        // Add system intro message
        initialMessages.push({
          id: Date.now(),
          text: "Welcome to the group discussion phase. Each of the AI agents will introduce themselves, and then you can discuss each policy area to reach consensus.",
          sender: 'System',
          isUser: false,
          timestamp: Date.now()
        });
        
        // Add agent introduction message
        initialMessages.push({
          id: Date.now() + 1,
          text: "Let me introduce you to your discussion partners...",
          sender: 'System',
          isUser: false,
          timestamp: Date.now() + 100
        });
        
        // Set all initial messages at once to prevent duplicates
        setMessages(initialMessages);
        
        // Add each agent introduction with a delay
        for (let i = 0; i < agents.length; i++) {
          const agent = agents[i];
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Generate a single introduction for each agent
          const introText = generateOpeningStatement(agent);
          
          const agentMessage: MessageType = {
            id: Date.now() + Math.random(),
            text: introText,
            sender: agent.name,
            isUser: false,
            avatar: agent.avatar,
            timestamp: Date.now()
          };
          
          // Add one message at a time
          setMessages(prevMessages => [...prevMessages, agentMessage]);
        }
        
        // Add message to start discussion after all introductions
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const startDiscussionMessage: MessageType = {
          id: Date.now() + Math.random(),
          text: `Let's begin our discussion with the first policy category: ${policyCategories[0].name}. What are your thoughts on this issue?`,
          sender: 'System',
          isUser: false,
          timestamp: Date.now()
        };
        
        setMessages(prevMessages => [...prevMessages, startDiscussionMessage]);
        
        // Mark introductions as complete
        setDiscussionStep('agentIntrosComplete');
        
        // Move to discussion step
        setCurrentStep('discussion');
      };
      
      initializeDiscussion();
    }
  }, [currentStep, agents, policyCategories]);
  
  // Auto scroll to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Handle when all categories have been discussed
  useEffect(() => {
    if (typeof currentCategory === "number" && currentCategory >= policyCategories.length && currentStep === 'results') {
      // Check if we've already calculated total budget
      const totalBudget = Object.keys(groupDecisions).reduce((total, catId) => {
        const category = policyCategories.find(cat => cat.id === Number(catId));
        const option = category?.options.find(opt => opt.id === groupDecisions[Number(catId)]);
        return total + (option?.cost || 0);
      }, 0);
      
      // Add a summary message
      const summaryMessage: MessageType = {
        id: Date.now() + 3,
        text: `We've completed our discussion of all policy categories. Our final decisions use ${totalBudget} of our 14 budget units. Thank you for your participation in this important dialogue about refugee education.`,
        sender: 'System',
        isUser: false,
        timestamp: Date.now()
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
  
  // Function to handle user message submission with proper agent response
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Add user message
    const newUserMessage: MessageType = {
      id: Date.now(),
      text: userInput,
      sender: 'You',
      isUser: true,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setProcessingResponse(true);
    
    try {
      // Determine which agent should respond based on discussion step
      // Let's rotate through all agents randomly
      const agentIndex = Math.floor(Math.random() * agents.length);
      const respondingAgent = agents[agentIndex];
      
      // Get AI response based on current category and user input
      const promptContext = `The discussion is about ${policyCategories[currentCategory]?.name}. 
      The user said: "${userInput}"
      Respond as ${respondingAgent.name}, a ${respondingAgent.politicalStance} politician.`;
      
      // Get response from OpenAI API
      let response = '';
      try {
        // Try to get AI-generated response
        response = await getAIResponse(
          promptContext,
          respondingAgent.isAlly ? 'ally' : 'opponent'
        );
        console.log("Received AI response:", response);
      } catch (error) {
        console.error("Error getting AI response:", error);
        // Fallback to template responses
        response = generatePolicyResponse(respondingAgent, policyCategories[currentCategory], user.policyChoices[policyCategories[currentCategory].id] || 0);
      }
      
      // Add agent response
      const newAgentMessage: MessageType = {
        id: Date.now() + 1,
        text: response,
        sender: respondingAgent.name,
        isUser: false,
        avatar: respondingAgent.avatar,
        timestamp: Date.now()
      };
      
      // Add slight delay to simulate typing
      setTimeout(() => {
        setMessages(prev => [...prev, newAgentMessage]);
        setProcessingResponse(false);
        
        // After 2-3 messages, prompt for voting on the current policy
        const currentMessageCount = messages.length + 2; // +2 for the messages we just added
        if (currentMessageCount >= 5 && discussionStep !== 'voting') {
          setTimeout(() => {
            // Add voting prompt message
            const votingPromptMessage: MessageType = {
              id: Date.now() + 2,
              text: `We've had a good discussion about ${policyCategories[currentCategory].name}. Shall we proceed to voting on this policy?`,
              sender: 'System',
              isUser: false,
              timestamp: Date.now()
            };
            
            setMessages(prev => [...prev, votingPromptMessage]);
            setCurrentStep('voting');
          }, 1500);
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error in message handling:", error);
      setProcessingResponse(false);
    }
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
    setTimeout(async () => {
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
          // Add consensus message using AI if possible
          let consensusText = "";
          try {
            consensusText = await generateAIConsensusMessage(
              category.name, 
              winningOptionDetails.title,
              winningOptionDetails.description
            );
          } catch (error) {
            // Fallback to template
            consensusText = generateConsensusMessage(category.name, winningOptionDetails.title);
          }
          
          const consensusMessage: MessageType = {
            id: Date.now() + 4,
            text: consensusText,
            sender: 'System',
            isUser: false,
            timestamp: Date.now()
          };
          
          setMessages(prevMessages => [...prevMessages, consensusMessage]);
          
          // Move to next category or finish
          setTimeout(() => {
            const nextCategoryIndex = currentCategory + 1;
            
            if (nextCategoryIndex < policyCategories.length) {
              setCurrentCategory(nextCategoryIndex);
              setCurrentStep('discussion');
              setVotes({});
              
              // Add message about the next category
              const nextCategoryMessage: MessageType = {
                id: Date.now() + 5,
                text: `Let's move on to the next policy category: ${policyCategories[nextCategoryIndex].name}. What are your thoughts on this issue?`,
                sender: 'System',
                isUser: false,
                timestamp: Date.now()
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
  
  // Handle proceed to Phase 3
  const handleProceedToPhase3 = () => {
    dispatch({ type: 'SET_PHASE', payload: 'phase3' });
  };

  // Get current step icon
  const getStepIcon = () => {
    switch (currentStep) {
      case 'intro':
        return <GroupsIcon fontSize="large" />;
      case 'discussion':
        return <ChatIcon fontSize="large" />;
      case 'voting':
        return <HowToVoteIcon fontSize="large" />;
      case 'results':
        return <CheckCircleIcon fontSize="large" />;
      default:
        return <ChatIcon fontSize="large" />;
    }
  };
  
  // Add a cleanup function for when the component unmounts or phase changes
  useEffect(() => {
    return () => {
      // Clear the initialization flag when leaving this phase
      if (state.phase !== 'phase2') {
        localStorage.removeItem('discussionInitialized');
        sessionStorage.clear(); // Clear all cached responses
      }
    };
  }, [state.phase]);
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ 
          mb: 1,
          color: theme.palette.primary.light,
          textShadow: '0 0 10px rgba(139, 221, 255, 0.5)',
          letterSpacing: '0.05em',
          fontWeight: 'bold'
        }}>
          Phase II: Group Discussion & Consensus Building
        </Typography>
        
        <Typography variant="h6" align="center" gutterBottom sx={{ mb: 3, color: theme.palette.text.secondary }}>
          Discuss your policy choices with AI agents and reach consensus through voting.
        </Typography>

        {/* Phase Progress Indicator */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 4, 
          p: 2, 
          backgroundImage: 'linear-gradient(to right, rgba(20, 20, 30, 0.8), rgba(30, 30, 50, 0.8), rgba(20, 20, 30, 0.8))',
          borderRadius: '12px',
          border: `1px solid rgba(139, 221, 255, 0.2)`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, opacity: currentStep === 'intro' ? 1 : 0.5 }}>
            <GroupsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="body2" color="text.secondary">Introduction</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, opacity: currentStep === 'discussion' ? 1 : 0.5 }}>
            <ChatIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="body2" color="text.secondary">Discussion</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, opacity: currentStep === 'voting' ? 1 : 0.5 }}>
            <HowToVoteIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="body2" color="text.secondary">Voting</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, opacity: currentStep === 'results' ? 1 : 0.5 }}>
            <CheckCircleIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="body2" color="text.secondary">Results</Typography>
          </Box>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 3 
        }}>
          {/* Left panel: Policy options and budget */}
          <Box sx={{ width: { xs: '100%', md: '30%' } }}>
            <Paper elevation={3} sx={{ 
              p: 3, 
              mb: 3, 
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              backgroundImage: 'linear-gradient(to bottom, rgba(30, 30, 50, 0.95), rgba(25, 25, 45, 0.97))',
              borderRadius: '8px',
              boxShadow: `0 5px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(139, 221, 255, 0.2)`
            }}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ 
                display: 'flex', 
                alignItems: 'center',
                pb: 1,
                borderBottom: `1px solid ${theme.palette.divider}`
              }}>
                <HowToVoteIcon sx={{ mr: 1 }} />
                Your Policy Selections
              </Typography>
              
              <BudgetSummary showRemaining={false} />
              
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {policyCategories.map(cat => {
                  const userChoice = user.policyChoices[cat.id];
                  const option = cat.options.find(opt => opt.id === userChoice);
                  const isActiveCategory = cat.id === category?.id;
                  
                  return (
                    <Box 
                      key={cat.id} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 1,
                        borderRadius: '4px',
                        backgroundColor: isActiveCategory ? 'rgba(139, 221, 255, 0.1)' : 'transparent',
                        border: isActiveCategory ? `1px solid ${theme.palette.primary.main}` : 'none'
                      }}
                    >
                      <Typography variant="body2">{cat.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: isActiveCategory ? theme.palette.primary.light : 'inherit'
                            }}
                          >
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
              <Paper elevation={3} sx={{ 
                p: 3, 
                mb: 3, 
                borderLeft: `4px solid ${theme.palette.secondary.main}`,
                backgroundColor: 'rgba(30, 30, 45, 0.95)'
              }}>
                <Typography variant="h6" gutterBottom color="secondary">
                  Vote on {category?.name}
                </Typography>
                
                {processingVotes ? (
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Tallying votes...
                    </Typography>
                    <LinearProgress color="secondary" />
                  </Box>
                ) : (
                  <Button 
                    variant="contained" 
                    color="secondary" 
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
              <Paper elevation={3} sx={{
                p: 3,
                borderLeft: `4px solid ${theme.palette.success.main}`,
                backgroundColor: 'rgba(30, 30, 45, 0.95)'
              }}>
                <Typography variant="h6" gutterBottom color="success.light" sx={{ mb: 2 }}>
                  Discussion Complete
                </Typography>
                <Typography variant="body2" paragraph>
                  Your group has successfully discussed and voted on all policy categories.
                </Typography>
                <Button 
                  variant="contained" 
                  color="success" 
                  fullWidth 
                  onClick={handleProceedToPhase3}
                  sx={{ mt: 2 }}
                >
                  Proceed to Phase III
                </Button>
              </Paper>
            )}

            {/* Agent Profiles Card */}
            <Paper elevation={3} sx={{ 
              p: 3, 
              mt: 3, 
              borderLeft: `4px solid ${theme.palette.info.main}`,
              backgroundColor: 'rgba(30, 30, 45, 0.95)'
            }}>
              <Typography variant="h6" gutterBottom color="info.light" sx={{ 
                display: 'flex', 
                alignItems: 'center',
                pb: 1,
                borderBottom: `1px solid ${theme.palette.divider}`
              }}>
                <GroupsIcon sx={{ mr: 1 }} />
                Discussion Group
              </Typography>
              
              <Stack spacing={1} sx={{ mt: 2 }}>
                {agents.map(agent => (
                  <Box key={agent.id} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 1,
                    borderRadius: '4px'
                  }}>
                    <Box 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        mr: 1.5,
                        backgroundColor: agent.politicalStance.toLowerCase() === 'conservative' ? '#0047AB' :
                                        agent.politicalStance.toLowerCase() === 'liberal' ? '#00BFFF' :
                                        agent.politicalStance.toLowerCase() === 'socialist' ? '#DC143C' : '#9370DB'
                      }}
                    >
                      {agent.name.charAt(0)}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                        {agent.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                        {agent.politicalStance}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Box>
          
          {/* Right panel: Chat interface */}
          <Box sx={{ width: { xs: '100%', md: '70%' } }}>
            <Paper elevation={3} sx={{ 
              p: 2, 
              flexGrow: 1, 
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              height: { xs: '500px', sm: '600px', md: '650px', lg: '700px' },
              mb: 2,
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }} ref={chatContainerRef}>
              {messages.length === 0 ? (
                // Show this when no messages are available
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  p: 4,
                  textAlign: 'center',
                  opacity: 0.7
                }}>
                  <ChatIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                  <Typography variant="h6" color="primary.light" gutterBottom>
                    Welcome to the Discussion Phase
                  </Typography>
                  <Typography variant="body1">
                    Your conversation with the agents will appear here.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, maxWidth: '80%' }}>
                    Please wait while the system initializes the discussion...
                  </Typography>
                </Box>
              ) : (
                // Show messages when they're available
                messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      mb: 2,
                      justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {!message.isUser && (
                      <Avatar
                        src={message.avatar}
                        sx={{ 
                          mr: 1, 
                          width: 40, 
                          height: 40,
                          bgcolor: message.sender === 'System' 
                            ? 'primary.dark'
                            : message.sender === 'Alex'
                            ? '#00BFFF'
                            : message.sender === 'Jordan'
                            ? '#0047AB'
                            : message.sender === 'Morgan'
                            ? '#DC143C'
                            : '#9370DB'
                        }}
                      >
                        {message.sender.charAt(0)}
                      </Avatar>
                    )}
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        maxWidth: '80%',
                        backgroundColor: message.isUser
                          ? 'primary.main'
                          : message.sender === 'System'
                          ? 'rgba(30, 30, 60, 0.8)'
                          : 'background.paper',
                        color: message.isUser ? 'white' : 'text.primary',
                        borderRadius: message.isUser
                          ? '15px 15px 0 15px'
                          : '15px 15px 15px 0',
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        {message.sender}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          fontSize: '1rem'
                        }}
                      >
                        {message.text}
                      </Typography>
                    </Paper>
                    {message.isUser && (
                      <Avatar sx={{ ml: 1, width: 40, height: 40 }}>You</Avatar>
                    )}
                  </Box>
                ))
              )}
              
              {processingResponse && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      backgroundColor: 'background.paper',
                      borderRadius: '15px 15px 15px 0',
                    }}
                  >
                    <Typography variant="body1">
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Typing...
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Paper>
            
            {/* Input area */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type your message here..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={discussionStep === 'voting' || processingResponse}
                InputProps={{
                  sx: { 
                    borderRadius: 4,
                    fontSize: '1rem',
                    backgroundColor: 'rgba(30, 30, 60, 0.4)',
                  }
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!userInput.trim() || discussionStep === 'voting' || processingResponse}
                sx={{ ml: 1 }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Phase2; 