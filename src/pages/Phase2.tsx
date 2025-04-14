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
import { PolicyCategory, Agent } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// Fix the SpeechRecognition type errors
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Create a proper SpeechRecognition implementation
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition: any = null;

// Initialize speech recognition if available
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
}

interface MessageType {
  id: number;
  text: string;
  sender: string;
  isUser: boolean;
  avatar?: string;
  timestamp: number;
  agent?: Agent;
}

// Function to check if a message with similar text already exists
const isDuplicateMessage = (messages: MessageType[], newMessage: MessageType): boolean => {
  return messages.some(msg => 
    msg.sender === newMessage.sender &&
    msg.text === newMessage.text
  );
};

const Phase2: React.FC = () => {
  console.log("Phase2 component rendering");
  const { state, dispatch } = useGameContext();
  const { policyCategories, agents, user, groupDecisions } = state;
  const theme = useTheme();
  
  console.log("GameContext state:", {
    agentsCount: agents?.length || 0,
    userPolicies: Object.keys(user?.policyChoices || {}).length,
    policyCategoriesCount: policyCategories?.length || 0
  });
  
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
  
  // Fix the dependency array to a stable reference
  useEffect(() => {
    console.log("Initial Phase2 useEffect running");
    
    // Ensure agents are initialized just once
    dispatch({ type: 'INITIALIZE_AI_CHOICES' });
    
    // Force scroll to top
    window.scrollTo(0, 0);
    
    // Clean up all storage flags
    localStorage.removeItem('phase2_discussion_initialized');
    localStorage.removeItem('discussionInitialized');
    localStorage.removeItem('introCompleted');
    localStorage.removeItem('votingTriggered');
    sessionStorage.clear();
    
    console.log("Phase2 component initialized with", agents?.length || 0, "agents");
    
    // Clear all existing messages first to avoid duplicates
    setMessages([]);
    
    // Only initialize if we have agents data
    const startInitialization = () => {
      if (agents && agents.length > 0) {
        console.log("Starting initialization with", agents.length, "agents");
        setTimeout(() => {
          // Double check we don't already have messages
          if (messages.length === 0) {
            initializeDiscussion();
          }
        }, 300);
      } else {
        console.log("No agents available, waiting for data");
      }
    };
    
    // Start initialization with a short delay to ensure state is ready
    const initTimer = setTimeout(startInitialization, 500);
    
    // Cleanup the timer if component unmounts
    return () => clearTimeout(initTimer);
  }, []); // Empty dependency array to ensure this only runs once

  // Modified initializeDiscussion function to prevent duplicates
  const initializeDiscussion = async () => {
    console.log("initializeDiscussion called with agents:", agents?.length || 0);
    
    // Set of unique message IDs to prevent duplicates
    const processedMessageIds = new Set<number>();
    
    // Helper to add a message only if not a duplicate
    const addUniqueMessage = (message: MessageType) => {
      if (!processedMessageIds.has(message.id)) {
        processedMessageIds.add(message.id);
        setMessages(prev => [...prev, message]);
        return true;
      }
      console.log("Duplicate message detected, skipping:", message.id);
      return false;
    };
    
    // Generate a truly unique ID
    const generateUniqueId = () => {
      const id = Date.now() + Math.random() * 10000;
      return id;
    };
    
    // System welcome message
    const welcomeMessage: MessageType = {
      id: generateUniqueId(),
      text: "Welcome to the group discussion phase. Each of the AI agents will introduce themselves, and then you can discuss each policy area to reach consensus.",
      sender: 'System',
      isUser: false,
      timestamp: Date.now()
    };
    addUniqueMessage(welcomeMessage);
    
    // Short pause
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // System introduction message
    const introMessage: MessageType = {
      id: generateUniqueId(),
      text: "Let me introduce you to your discussion partners...",
      sender: 'System',
      isUser: false,
      timestamp: Date.now() + 100
    };
    addUniqueMessage(introMessage);
    
    // Process each agent exactly once
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const introText = `Hello everyone, I am ${agent.name}, a ${agent.age}-year-old ${agent.occupation} with ${agent.education}. As a ${agent.politicalStance} member of parliament in the Republic of Bean, I'm looking forward to discussing refugee education policies with all of you.`;
      
      const agentMessage: MessageType = {
        id: generateUniqueId(),
        text: introText,
        sender: agent.name,
        isUser: false,
        avatar: agent.avatar,
        timestamp: Date.now() + 300 + (i * 100),
        agent: agent
      };
      
      addUniqueMessage(agentMessage);
    }
    
    // Start discussion message
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const startDiscussionMessage: MessageType = {
      id: generateUniqueId(),
      text: `Let's begin our discussion with the first policy category: ${policyCategories[0].name}. What are your thoughts on this issue?`,
      sender: 'System',
      isUser: false,
      timestamp: Date.now() + 1000
    };
    
    addUniqueMessage(startDiscussionMessage);
    
    // Move to discussion step
    setDiscussionStep('agentIntrosComplete');
    setCurrentStep('discussion');
  };

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
  
  // Modified handleSendMessage to use the de-duplication function
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Generate a unique ID for this message
    const messageId = Date.now() + Math.random() * 1000;
    
    // Add user message
    const newUserMessage: MessageType = {
      id: messageId,
      text: userInput,
      sender: 'You',
      isUser: true,
      timestamp: Date.now()
    };
    
    console.log("Adding user message:", newUserMessage.text);
    
    // Add message only if it's not a duplicate
    setMessages(prev => {
      if (isDuplicateMessage(prev, newUserMessage)) {
        console.log("Duplicate user message detected, not adding");
        return prev;
      }
      return [...prev, newUserMessage];
    });
    
    setUserInput('');
    setProcessingResponse(true);
    
    try {
      // Check if the user's message suggests they want to proceed to voting
      const suggestsVoting = 
        userInput.toLowerCase().includes('vote') || 
        userInput.toLowerCase().includes('proceed') ||
        userInput.toLowerCase().includes('decide') ||
        userInput.toLowerCase().includes('moving on') ||
        userInput.toLowerCase().includes('consensus') ||
        userInput.toLowerCase().includes('okay');
        
      // Get count of user messages
      const userMessageCount = messages.filter(m => m.isUser).length;
      
      // Generate a simple agent response
      const randomAgentIndex = Math.floor(Math.random() * agents.length);
      const respondingAgent = agents[randomAgentIndex];
      
      // Add a short delay to simulate thinking
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create varied responses based on political stance
      let response = "";
      if (respondingAgent.politicalStance === "Conservative") {
        response = `I understand your perspective, but I believe we need to consider the fiscal implications of these policies. As a conservative, I want to make sure we're using resources efficiently while still providing quality education.`;
      } else if (respondingAgent.politicalStance === "Progressive") {
        response = `I appreciate your input. From my progressive standpoint, I think we should prioritize inclusive programs that ensure refugee students have equal access to education and support services.`;
      } else if (respondingAgent.politicalStance === "Socialist") {
        response = `Thank you for your thoughts. As a socialist, I believe we need comprehensive integration programs that provide equal opportunities for refugee children, regardless of cost concerns.`;
      } else {
        response = `Thank you for sharing that. As a moderate, I believe we need to find a balanced approach that addresses the needs of refugee students while working within our budgetary constraints.`;
      }
      
      const newAgentMessage: MessageType = {
        id: Date.now() + Math.random() * 1000,
        text: response,
        sender: respondingAgent.name,
        isUser: false,
        avatar: respondingAgent.avatar,
        timestamp: Date.now(),
        agent: respondingAgent
      };
      
      console.log("Adding agent response:", newAgentMessage.text);
      
      // Add agent message only if it's not a duplicate
      setMessages(prev => {
        if (isDuplicateMessage(prev, newAgentMessage)) {
          console.log("Duplicate agent message detected, not adding");
          return prev;
        }
        return [...prev, newAgentMessage];
      });
      
      setProcessingResponse(false);
      
      // Trigger voting prompt after 3 user messages or if user suggests voting
      if ((userMessageCount >= 2 || suggestsVoting) && currentStep !== 'voting') {
        // Short delay before showing voting prompt
        setTimeout(() => {
          // Add voting prompt message
          const votingPromptMessage: MessageType = {
            id: Date.now() + Math.random() * 1000,
            text: `We've had a good discussion about ${policyCategories[currentCategory].name}. Shall we proceed to voting on this policy?`,
            sender: 'System',
            isUser: false,
            timestamp: Date.now()
          };
          
          // Add voting message only if it's not a duplicate
          setMessages(prev => {
            if (isDuplicateMessage(prev, votingPromptMessage)) {
              console.log("Duplicate voting prompt detected, not adding");
              return prev;
            }
            // Only proceed to voting if we haven't already
            setCurrentStep('voting');
            return [...prev, votingPromptMessage];
          });
        }, 1500);
      }
      
    } catch (error) {
      console.error("Error in message handling:", error);
      setProcessingResponse(false);
    }
  };
  
  // Enhanced voice input toggle with better feedback
  const toggleVoiceInput = () => {
    if (!recognition) {
      // Speech recognition not available
      alert("Speech recognition is not supported in your browser. Please try using Chrome.");
      return;
    }
    
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      try {
        recognition.stop();
        console.log("Speech recognition stopped manually");
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    } else {
      // Start recording
      setIsRecording(true);
      
      // Reset handlers to avoid duplicates
      if (recognition.onresult) recognition.onresult = null;
      if (recognition.onerror) recognition.onerror = null;
      if (recognition.onend) recognition.onend = null;
      
      // Set up the handlers
      recognition.onresult = (event: any) => {
        console.log("Speech recognition result:", event);
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          console.log("Recognized speech:", transcript);
          
          // Update user input with the recognized text
          setUserInput(prevInput => {
            const trimmedPrev = prevInput.trim();
            const newValue = trimmedPrev 
              ? `${trimmedPrev} ${transcript}`
              : transcript;
            return newValue;
          });
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        // Add a user-friendly message for permission issues
        if (event.error === 'not-allowed') {
          setUserInput(prevInput => 
            prevInput + " (Please enable microphone permissions to use voice input.)"
          );
        }
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        console.log("Speech recognition ended naturally");
        setIsRecording(false);
      };
      
      // Start listening
      try {
        recognition.start();
        console.log("Speech recognition started successfully");
        
        // We'll also set a backup timer to stop recording after 10 seconds
        // in case the onend event doesn't fire for some reason
        setTimeout(() => {
          if (isRecording) {
            console.log("Backup timer stopping speech recognition");
            setIsRecording(false);
            try {
              recognition.stop();
            } catch (error) {
              console.error("Error stopping speech recognition from timer:", error);
            }
          }
        }, 10000);
        
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsRecording(false);
        alert("There was an error starting speech recognition. Please try again.");
      }
    }
  };
  
  // Simplified handleVote function to ensure it works correctly
  const handleVote = () => {
    console.log("Vote initiated for category:", category.name);
    setProcessingVotes(true);
    
    // Simple voting simulation - the user's choice wins 80% of the time
    const votingResultsText = generateVotingResults();
    
    // Add a short delay to simulate vote processing
    setTimeout(() => {
      setProcessingVotes(false);
      
      // Get the user's choice for this category
      const userChoice = user.policyChoices[category.id];
      
      // If user hasn't made a choice, pick a reasonable default
      let winningOption = userChoice || category.options[1].id;
      
      // Record the group decision
      dispatch({
        type: 'SET_GROUP_DECISION',
        payload: { categoryId: category.id, optionId: winningOption }
      });
      
      // Add voting results message
      const resultsMessage: MessageType = {
        id: Date.now() + Math.random() * 1000,
        text: votingResultsText,
        sender: 'System',
        isUser: false,
        timestamp: Date.now()
      };
      
      // Add the message with de-duplication
      setMessages(prev => {
        if (isDuplicateMessage(prev, resultsMessage)) {
          return prev;
        }
        return [...prev, resultsMessage];
      });
      
      // Short delay before moving to next category
      setTimeout(() => {
        const nextCategoryIndex = currentCategory + 1;
        
        if (nextCategoryIndex < policyCategories.length) {
          // Move to next category
          setCurrentCategory(nextCategoryIndex);
          setCurrentStep('discussion');
          
          // Add message about next category
          const nextCategoryMessage: MessageType = {
            id: Date.now() + Math.random() * 1000,
            text: `Let's move on to the next policy category: ${policyCategories[nextCategoryIndex].name}. What are your thoughts on this issue?`,
            sender: 'System',
            isUser: false,
            timestamp: Date.now()
          };
          
          // Add with de-duplication
          setMessages(prev => {
            if (isDuplicateMessage(prev, nextCategoryMessage)) {
              return prev;
            }
            return [...prev, nextCategoryMessage]; 
          });
        } else {
          // We've finished all categories
          setCurrentStep('results');
          
          // Add summary message
          const summaryMessage: MessageType = {
            id: Date.now() + Math.random() * 1000,
            text: `We've completed our discussion of all policy categories. Thank you for your participation in this important dialogue about refugee education.`,
            sender: 'System',
            isUser: false,
            timestamp: Date.now()
          };
          
          // Add with de-duplication
          setMessages(prev => {
            if (isDuplicateMessage(prev, summaryMessage)) {
              return prev;
            }
            return [...prev, summaryMessage];
          });
        }
      }, 1500);
    }, 1500);
  };
  
  // Helper function to generate voting results
  const generateVotingResults = () => {
    // Get the user's choice for this category
    const userChoice = user.policyChoices[category.id];
    
    // Get the option details
    const userOption = category.options.find(opt => opt.id === userChoice);
    
    // Generate voting results text
    let resultsText = `Voting results for ${category.name}:\n\n`;
    
    if (userOption) {
      resultsText += `The group has voted to adopt: ${userOption.title}\n\n`;
      resultsText += `This option will use ${userOption.cost} out of our 14 budget units.\n\n`;
      resultsText += "Thank you for your participation in the voting process.";
    } else {
      // If user hasn't made a choice, default to the middle option
      const defaultOption = category.options[1];
      resultsText += `The group has voted to adopt: ${defaultOption.title}\n\n`;
      resultsText += `This option will use ${defaultOption.cost} out of our 14 budget units.\n\n`;
      resultsText += "Thank you for your participation in the voting process.";
    }
    
    return resultsText;
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
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="phase2-container"
    >
      {/* Debugging panel */}
      {messages.length === 0 && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, p: 2, bgcolor: 'rgba(0,0,0,0.8)', color: 'white', borderRadius: 2, zIndex: 9999, maxWidth: 300 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
            Agents: {agents?.length || 0} | Step: {currentStep} | Discussion: {discussionStep}
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            color="error"
            fullWidth
            onClick={() => {
              // Force complete reset
              console.log("Emergency reset triggered");
              localStorage.clear();
              sessionStorage.clear();
              setMessages([]);
              dispatch({ type: 'INITIALIZE_AI_CHOICES' });
              setTimeout(() => {
                initializeDiscussion();
              }, 300);
            }}
            sx={{ fontSize: '0.7rem', py: 0.5 }}
          >
            Emergency Reset
          </Button>
        </Box>
      )}
      
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" align="center" gutterBottom sx={{ 
            mb: 1,
            color: theme.palette.primary.light,
            textShadow: '0 0 10px rgba(139, 221, 255, 0.5), 0 0 20px rgba(139, 221, 255, 0.3)',
            letterSpacing: '0.08em',
            fontWeight: 'bold',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' }
          }}>
            Phase II: Group Discussion & Consensus Building
          </Typography>
          
          <Typography variant="h6" align="center" gutterBottom sx={{ 
            mb: 3, 
            color: theme.palette.text.secondary,
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
          }}>
            Discuss your policy choices with AI agents and reach consensus through voting.
          </Typography>

          {/* Phase Progress Indicator */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 4, 
            p: 3, 
            backgroundImage: 'linear-gradient(to right, rgba(20, 20, 30, 0.8), rgba(30, 30, 50, 0.8), rgba(20, 20, 30, 0.8))',
            borderRadius: '12px',
            border: `1px solid rgba(139, 221, 255, 0.2)`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 20px rgba(139, 221, 255, 0.1)',
            padding: { xs: '10px', md: '16px' },
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mx: 2, 
              opacity: currentStep === 'intro' ? 1 : 0.5,
              flexDirection: { xs: 'column', sm: 'row' },
              minWidth: { xs: '60px', sm: 'auto' }
            }}>
              <GroupsIcon sx={{ 
                mr: { xs: 0, sm: 1 }, 
                mb: { xs: 1, sm: 0 },
                color: theme.palette.primary.main,
                fontSize: { xs: '1.5rem', md: '1.8rem' }
              }} />
              <Typography variant="body2" color="text.secondary">Introduction</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />
            <Divider orientation="horizontal" sx={{ my: 1, width: '100%', display: { xs: 'block', sm: 'none' } }} />
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mx: 2, 
              opacity: currentStep === 'discussion' ? 1 : 0.5,
              flexDirection: { xs: 'column', sm: 'row' },
              minWidth: { xs: '60px', sm: 'auto' }
            }}>
              <ChatIcon sx={{ 
                mr: { xs: 0, sm: 1 }, 
                mb: { xs: 1, sm: 0 },
                color: theme.palette.primary.main,
                fontSize: { xs: '1.5rem', md: '1.8rem' }
              }} />
              <Typography variant="body2" color="text.secondary">Discussion</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />
            <Divider orientation="horizontal" sx={{ my: 1, width: '100%', display: { xs: 'block', sm: 'none' } }} />
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mx: 2, 
              opacity: currentStep === 'voting' ? 1 : 0.5,
              flexDirection: { xs: 'column', sm: 'row' },
              minWidth: { xs: '60px', sm: 'auto' }
            }}>
              <HowToVoteIcon sx={{ 
                mr: { xs: 0, sm: 1 }, 
                mb: { xs: 1, sm: 0 },
                color: theme.palette.primary.main,
                fontSize: { xs: '1.5rem', md: '1.8rem' }
              }} />
              <Typography variant="body2" color="text.secondary">Voting</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />
            <Divider orientation="horizontal" sx={{ my: 1, width: '100%', display: { xs: 'block', sm: 'none' } }} />
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mx: 2, 
              opacity: currentStep === 'results' ? 1 : 0.5,
              flexDirection: { xs: 'column', sm: 'row' },
              minWidth: { xs: '60px', sm: 'auto' }
            }}>
              <CheckCircleIcon sx={{ 
                mr: { xs: 0, sm: 1 }, 
                mb: { xs: 1, sm: 0 },
                color: theme.palette.primary.main,
                fontSize: { xs: '1.5rem', md: '1.8rem' }
              }} />
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
                <Typography variant="h5" gutterBottom color="primary" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  pb: 1,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  fontFamily: '"Pixelify Sans", monospace',
                  fontSize: { xs: '1.3rem', md: '1.5rem' }
                }}>
                  <HowToVoteIcon sx={{ mr: 1, fontSize: { xs: '1.4rem', md: '1.6rem' } }} />
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
                          p: 1.5,
                          borderRadius: '4px',
                          backgroundColor: isActiveCategory ? 'rgba(139, 221, 255, 0.1)' : 'transparent',
                          border: isActiveCategory ? `1px solid ${theme.palette.primary.main}` : 'none',
                          fontSize: { xs: '0.9rem', md: '1rem' }
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{cat.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {option && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: isActiveCategory ? theme.palette.primary.light : 'inherit',
                                fontSize: { xs: '0.85rem', md: '0.95rem' }
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
                  backgroundColor: 'rgba(30, 30, 45, 0.95)',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
                }}>
                  <Typography variant="h5" gutterBottom color="secondary" sx={{
                    fontFamily: '"Pixelify Sans", monospace',
                    fontSize: { xs: '1.3rem', md: '1.5rem' }
                  }}>
                    Vote on {category?.name}
                  </Typography>
                  
                  {/* Show policy options for voting */}
                  <Box sx={{ mt: 2, mb: 3 }}>
                    {category.options.map(option => (
                      <Box 
                        key={option.id}
                        sx={{ 
                          p: 2, 
                          mb: 1.5, 
                          borderRadius: '8px',
                          backgroundColor: user.policyChoices[category.id] === option.id 
                            ? 'rgba(25, 118, 210, 0.1)' 
                            : 'transparent',
                          border: '1px solid',
                          borderColor: user.policyChoices[category.id] === option.id 
                            ? theme.palette.primary.main 
                            : theme.palette.divider,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                        onClick={() => {
                          // Update user's policy choice for voting
                          dispatch({
                            type: 'SELECT_POLICY_OPTION',
                            payload: { categoryId: category.id, optionId: option.id }
                          });
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {option.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Cost: {option.cost} budget units
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  
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
                      sx={{ 
                        mt: 2,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}
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
                  backgroundColor: 'rgba(30, 30, 45, 0.95)',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
                }}>
                  <Typography variant="h5" gutterBottom color="success.light" sx={{ 
                    mb: 2,
                    fontFamily: '"Pixelify Sans", monospace',
                    fontSize: { xs: '1.3rem', md: '1.5rem' }
                  }}>
                    Discussion Complete
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Your group has successfully discussed and voted on all policy categories.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="success" 
                    fullWidth 
                    onClick={handleProceedToPhase3}
                    sx={{ 
                      mt: 2,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
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
                backgroundColor: 'rgba(30, 30, 45, 0.95)',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
              }}>
                <Typography variant="h5" gutterBottom color="info.light" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  pb: 1,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  fontFamily: '"Pixelify Sans", monospace',
                  fontSize: { xs: '1.3rem', md: '1.5rem' }
                }}>
                  <GroupsIcon sx={{ mr: 1 }} />
                  Discussion Group
                </Typography>
                
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {agents.map(agent => (
                    <Box key={agent.id} sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: '8px',
                      backgroundColor: 'rgba(50, 50, 70, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(50, 50, 70, 0.5)',
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      <Avatar 
                        src={agent.avatar} 
                        sx={{ 
                          width: { xs: 40, md: 48 }, 
                          height: { xs: 40, md: 48 }, 
                          mr: 2,
                          border: '2px solid',
                          borderColor: agent.politicalStance.toLowerCase() === 'conservative' ? '#0047AB' :
                                      agent.politicalStance.toLowerCase() === 'liberal' ? '#00BFFF' :
                                      agent.politicalStance.toLowerCase() === 'socialist' ? '#DC143C' : '#9370DB'
                        }}
                      >
                        {agent.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1.2, mb: 0.5 }}>
                          {agent.name}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            lineHeight: 1,
                            backgroundColor: agent.politicalStance.toLowerCase() === 'conservative' ? 'rgba(0, 71, 171, 0.2)' :
                                            agent.politicalStance.toLowerCase() === 'liberal' ? 'rgba(0, 191, 255, 0.2)' :
                                            agent.politicalStance.toLowerCase() === 'socialist' ? 'rgba(220, 20, 60, 0.2)' : 'rgba(147, 112, 219, 0.2)',
                            borderRadius: '4px',
                            px: 1,
                            py: 0.5,
                            color: agent.politicalStance.toLowerCase() === 'conservative' ? '#0047AB' :
                                   agent.politicalStance.toLowerCase() === 'liberal' ? '#00BFFF' :
                                   agent.politicalStance.toLowerCase() === 'socialist' ? '#DC143C' : '#9370DB'
                          }}
                        >
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
                height: { xs: '500px', sm: '600px', md: '700px', lg: '750px' },
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
                    <ChatIcon sx={{ fontSize: 80, mb: 3, color: 'primary.main' }} />
                    <Typography variant="h5" color="primary.light" gutterBottom>
                      Welcome to the Discussion Phase
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, fontSize: '1.1rem' }}>
                      Your conversation with the agents will appear here.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, mb: 3, maxWidth: '80%' }}>
                      Please wait while the system initializes the discussion...
                    </Typography>
                    
                    {/* Add force refresh button */}
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={() => {
                        // Force refresh initialization
                        console.log("Manual refresh triggered");
                        localStorage.removeItem('phase2_discussion_initialized');
                        localStorage.removeItem('discussionInitialized');
                        localStorage.removeItem('introCompleted');
                        dispatch({ type: 'INITIALIZE_AI_CHOICES' });
                        setTimeout(() => initializeDiscussion(), 200);
                      }}
                      sx={{ mt: 2 }}
                    >
                      Start Discussion
                    </Button>
                  </Box>
                ) : (
                  // Show messages when they're available
                  <AnimatePresence>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: msg.isUser ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {msg.isUser ? (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Paper
                              sx={{
                                p: 2,
                                bgcolor: 'primary.main',
                                color: 'white',
                                borderRadius: '12px 12px 0 12px',
                                maxWidth: '80%'
                              }}
                            >
                              <Typography variant="body1">{msg.text}</Typography>
                            </Paper>
                          </Box>
                        ) : (
                          msg.agent ? (
                            <AgentMessage agent={msg.agent} message={msg.text} alignRight={false} />
                          ) : (
                            // For system messages that don't have an agent
                            <Box sx={{ display: 'flex', mb: 2, maxWidth: '80%' }}>
                              <Avatar
                                sx={{
                                  mr: 1,
                                  bgcolor: 'primary.dark',
                                  boxShadow: '0 3px 6px rgba(0,0,0,0.2)'
                                }}
                              >
                                S
                              </Avatar>
                              <motion.div
                                initial={{ scale: 0.96 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Paper
                                  sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    bgcolor: 'rgba(30, 30, 60, 0.8)',
                                    color: 'white',
                                    boxShadow: '0 3px 10px rgba(0,0,0,0.25)'
                                  }}
                                >
                                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    System
                                  </Typography>
                                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {msg.text}
                                  </Typography>
                                </Paper>
                              </motion.div>
                            </Box>
                          )
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                
                {processingResponse && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          backgroundColor: 'background.paper',
                          borderRadius: '15px 15px 15px 0',
                        }}
                      >
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Typing...
                        </Typography>
                      </Paper>
                    </Box>
                  </motion.div>
                )}
              </Paper>
              
              {/* Input area */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    color={isRecording ? "error" : "primary"}
                    onClick={toggleVoiceInput}
                    disabled={discussionStep === 'voting' || processingResponse}
                    sx={{ 
                      p: 1.5,
                      border: isRecording ? '2px solid #f44336' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      backgroundColor: isRecording ? 'rgba(244, 67, 54, 0.1)' : 'rgba(25, 118, 210, 0.05)',
                      '&:hover': {
                        backgroundColor: isRecording ? 'rgba(244, 67, 54, 0.2)' : 'rgba(25, 118, 210, 0.1)',
                      }
                    }}
                  >
                    <MicIcon sx={{ fontSize: { xs: '1.5rem', md: '1.8rem' } }} />
                  </IconButton>
                  
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={isRecording ? "Listening..." : "Type your message here..."}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={discussionStep === 'voting' || processingResponse || isRecording}
                    InputProps={{
                      sx: { 
                        borderRadius: 4,
                        fontSize: '1.1rem',
                        backgroundColor: 'rgba(30, 30, 60, 0.4)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: isRecording ? '#f44336' : 'rgba(255, 255, 255, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: isRecording ? '#f44336' : 'rgba(255, 255, 255, 0.3)'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: isRecording ? '#f44336' : theme.palette.primary.main
                        }
                      }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || discussionStep === 'voting' || processingResponse}
                    sx={{ 
                      p: 1.5,
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: '50%',
                      backgroundColor: 'rgba(25, 118, 210, 0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      }
                    }}
                  >
                    <SendIcon sx={{ fontSize: { xs: '1.5rem', md: '1.8rem' } }} />
                  </IconButton>
                </Box>
              </motion.div>
            </Box>
          </Box>
        </Box>
      </Container>
    </motion.div>
  );
};

export default Phase2; 