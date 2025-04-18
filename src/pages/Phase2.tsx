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
  CircularProgress,
  Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import VerifiedIcon from '@mui/icons-material/Verified';
import GroupsIcon from '@mui/icons-material/Groups';
import ChatIcon from '@mui/icons-material/Chat';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
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
  
  // Helper function to get color based on political stance
  const getStanceColor = (stance: string) => {
    switch (stance?.toLowerCase()) {
      case 'conservative':
        return '#0047AB'; // Cobalt Blue
      case 'liberal':
      case 'progressive':
        return '#00BFFF'; // Deep Sky Blue
      case 'socialist':
        return '#DC143C'; // Crimson
      case 'moderate':
        return '#9370DB'; // Medium Purple
      default:
        return '#808080'; // Gray
    }
  };
  
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

  // Update the initializeDiscussion function for more natural introductions
  const initializeDiscussion = async () => {
    console.log("Starting fresh initialization");
    
    // Clear existing messages
    setMessages([]);
    
    // Track processed message IDs to prevent duplicates
    const processedIds = new Set<number>();
    
    // Helper to create and add a message with guaranteed uniqueness
    const addMessage = (messageData: Omit<MessageType, 'id'>) => {
      const id = Date.now() + Math.random() * 10000;
      const message = { ...messageData, id };
      
      setMessages(prev => {
        // Check if we already have a similar message
        const isDuplicate = prev.some(existing => 
          existing.sender === message.sender && 
          existing.text === message.text
        );
        
        if (isDuplicate) {
          console.log("Skipping duplicate message:", message.sender, message.text.substring(0, 20));
          return prev;
        }
        
        return [...prev, message];
      });
      
      return new Promise(resolve => setTimeout(resolve, 600));
    };
    
    // Welcome message that introduces the setup more naturally
    await addMessage({
      text: "Welcome to our discussion on refugee education policy. Our committee members will share their perspectives as we work toward building consensus.",
      sender: 'System',
      isUser: false,
      timestamp: Date.now()
    });
    
    // More natural introduction message
    await addMessage({
      text: "Let's have everyone introduce themselves briefly.",
      sender: 'System',
      isUser: false,
      timestamp: Date.now() + 100
    });
    
    // Agent introductions (more conversational with shorter intros)
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      
      let introText = "";
      switch (agent.name) {
        case "Dr. Sarah Chen":
          introText = "Hello everyone, I'm Sarah Chen from the Education Policy department. I'm looking forward to our discussion today about creating meaningful access to education for refugee students.";
          break;
        case "Thomas Reynolds":
          introText = "Hi there, Tom Reynolds here. I'm excited to work with all of you to develop practical and sustainable solutions for refugee education in our country.";
          break;
        case "Maria González":
          introText = "Hello colleagues, I'm Maria González. I've worked closely with refugee communities and am passionate about ensuring all students have equal opportunities in our education system.";
          break;
        case "James Taylor":
          introText = "Good to meet everyone. I'm James Taylor from the Education Ministry. I believe we can find balanced approaches that serve refugee students while being mindful of our resources.";
          break;
        default:
          introText = `Hello everyone, I'm ${agent.name}. I'm looking forward to discussing refugee education policies with all of you.`;
      }
      
      await addMessage({
        text: introText,
        sender: agent.name,
        isUser: false,
        avatar: agent.avatar,
        timestamp: Date.now() + (i * 100),
        agent: agent
      });
    }
    
    // Start discussion message - more conversational
    await addMessage({
      text: `Great, now that we're all acquainted, let's begin our discussion on the first topic: ${policyCategories[0].name}. What are your thoughts on this issue?`,
      sender: 'System',
      isUser: false,
      timestamp: Date.now() + 1000
    });
    
    // Set discussion state
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
  
  // Update handleSendMessage for more natural responses without political stance labels
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Clear any old voting flags from local storage
    localStorage.removeItem('votingTriggered');
    
    // Add user message
    const newUserMessage: MessageType = {
      id: Date.now() + Math.random() * 1000,
      text: userInput,
      sender: 'You',
      isUser: true,
      timestamp: Date.now()
    };
    
    setMessages(prev => {
      // Check for duplicates
      if (prev.some(msg => msg.isUser && msg.text === userInput)) {
        return prev;
      }
      return [...prev, newUserMessage];
    });
    
    setUserInput('');
    setProcessingResponse(true);
    
    try {
      // Check if message suggests voting
      const suggestsVoting = userInput.toLowerCase().match(/vote|proceed|decide|voting|consensus|okay|next|yes|go ahead/);
      
      // Get user message count
      const userMessageCount = messages.filter(m => m.isUser).length;
      
      // Determine which agents should respond
      // For early messages, get multiple responses to simulate a real discussion
      const shouldMultipleAgentsRespond = userMessageCount < 3 || 
        userInput.toLowerCase().includes('everyone') || 
        userInput.toLowerCase().includes('thoughts') || 
        userInput.toLowerCase().includes('opinions');
      
      // How many agents should respond (1-3 based on context)
      const respondingAgentCount = shouldMultipleAgentsRespond ? 
        Math.min(Math.max(1, agents.length - 1), userMessageCount === 0 ? 2 : 1) : 1;
      
      // Find agents who haven't responded recently
      const recentAgents = messages
        .slice(-4)
        .filter(m => !m.isUser && m.sender !== 'System')
        .map(m => m.sender);
      
      // Get agents who haven't spoken recently
      const availableAgents = agents.filter(a => !recentAgents.includes(a.name));
      
      // Fix the type for the respondingAgents array
      // Choose respondents
      const respondingAgents: Agent[] = [];
      if (availableAgents.length >= respondingAgentCount) {
        // Take agents who haven't spoken recently
        for (let i = 0; i < respondingAgentCount; i++) {
          respondingAgents.push(availableAgents[i]);
        }
      } else {
        // If we need more, take some from the full agent list
        const remainingNeeded = respondingAgentCount - availableAgents.length;
        respondingAgents.push(...availableAgents);
        
        const otherAgents = agents.filter(a => !respondingAgents.map(ra => ra.name).includes(a.name));
        for (let i = 0; i < remainingNeeded && i < otherAgents.length; i++) {
          respondingAgents.push(otherAgents[i]);
        }
      }
      
      // Get current policy category name
      const policyName = policyCategories[currentCategory]?.name || "refugee education";
      
      // Process each responding agent sequentially with slight delays
      for (let i = 0; i < respondingAgents.length; i++) {
        const agent = respondingAgents[i];
        
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
        
        // Create more natural conversational responses without explicit political stance
        let response = "";
        
        // Base responses on agent characteristics but make them more natural
        switch (agent.name) {
          case "Dr. Sarah Chen":
            if (userMessageCount === 0) {
              response = `I agree that access is critical. We should focus on programs that integrate refugee students into regular classrooms while providing specialized support. This approach promotes inclusion and helps students build connections with peers.`;
            } else if (suggestsVoting) {
              response = `I think we've had a good discussion. I'm ready to move forward with voting on ${policyName}.`;
            } else {
              response = `I see your point about ${policyName}. Research shows that inclusive approaches benefit all students, not just refugees. By investing in proper support services, we can help refugee students thrive in mainstream educational settings.`;
            }
            break;
            
          case "Thomas Reynolds":
            if (userMessageCount === 0) {
              response = `I think we need to be practical about this. Traditional schools have established frameworks that work. We should focus on integrating refugee students into existing structures with targeted language support when needed.`;
            } else if (suggestsVoting) {
              response = `Yes, I believe we've covered the key points. Let's proceed to voting and see where we stand on ${policyName}.`;
            } else {
              response = `That's an interesting perspective. We should consider the cost implications of any solution we propose. The most effective approach might be to enhance our existing school systems rather than creating entirely new structures.`;
            }
            break;
            
          case "Maria González":
            if (userMessageCount === 0) {
              response = `From my experience working with refugee communities, comprehensive integration is essential. Students need both academic support and cultural understanding. This means investing in specialized programs within mainstream schools.`;
            } else if (suggestsVoting) {
              response = `I agree we should move to voting. I hope we can choose an approach that truly supports the unique needs of refugee students in our education system.`;
            } else {
              response = `I appreciate what you've shared. When we design education policies, we need to center the voices of refugee students and their families. Their experiences should guide our approach to creating truly accessible education.`;
            }
            break;
            
          case "James Taylor":
            if (userMessageCount === 0) {
              response = `I think we can find a balanced approach here. Mixed classrooms with additional support services would provide integration while addressing specific needs of refugee students. This creates a supportive environment for all.`;
            } else if (suggestsVoting) {
              response = `I think we're ready to vote on this issue. We've heard some good perspectives on ${policyName}.`;
            } else {
              response = `You make some valid points. We should aim for solutions that balance integration with specialized support. This could include language assistance and cultural orientation within regular school settings.`;
            }
            break;
            
          default:
            response = `I think ${policyName} is an important issue. We need to consider both integration and specialized support for refugee students while being mindful of our available resources.`;
        }
        
        const newAgentMessage: MessageType = {
          id: Date.now() + Math.random() * 1000,
          text: response,
          sender: agent.name,
          isUser: false,
          avatar: agent.avatar,
          timestamp: Date.now() + (i * 300),
          agent: agent
        };
        
        setMessages(prev => {
          // Check for duplicates
          if (prev.some(msg => msg.sender === agent.name && msg.text === response)) {
            return prev;
          }
          return [...prev, newAgentMessage];
        });
        
        // Add slight delay between agent responses
        if (i < respondingAgents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setProcessingResponse(false);
      
      // Voting logic - trigger after messages or if user suggests voting
      const shouldShowVoting = 
        (userMessageCount >= 1 || suggestsVoting) && 
        currentStep !== 'voting' && 
        !localStorage.getItem('votingTriggered');
        
      if (shouldShowVoting) {
        // Prevent duplicate voting triggers
        localStorage.setItem('votingTriggered', 'true');
        
        setTimeout(() => {
          const votingPromptMessage: MessageType = {
            id: Date.now() + Math.random() * 1000,
            text: `It seems we've heard from everyone on ${policyCategories[currentCategory].name}. Shall we proceed to voting?`,
            sender: 'System',
            isUser: false,
            timestamp: Date.now()
          };
          
          setMessages(prev => {
            // Check for duplicates
            if (prev.some(msg => 
              msg.sender === 'System' && 
              msg.text.includes(`proceed to voting`)
            )) {
              return prev;
            }
            
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
  
  // Update the text of voting results to be more conversational
  const handleVote = () => {
    console.log("Vote initiated for category:", category.name);
    setProcessingVotes(true);
    
    // Get user's selected option
    const userChoice = user.policyChoices[category.id];
    
    // Get option details
    const selectedOption = userChoice 
      ? category.options.find(opt => opt.id === userChoice)
      : category.options[1]; // Default to middle option if none selected
    
    if (!selectedOption) {
      console.error("No option selected and couldn't find default");
      setProcessingVotes(false);
      return;
    }
    
    // Generate more conversational results text
    const votingResultsText = `Based on our discussion, the committee has agreed on "${selectedOption.title}" for ${category.name}. This will require ${selectedOption.cost} units from our budget. Let's continue to the next topic.`;
    
    // Simulate voting process
    setTimeout(() => {
      setProcessingVotes(false);
      
      // Record the decision with actual user choice
      dispatch({
        type: 'SET_GROUP_DECISION',
        payload: { 
          categoryId: category.id, 
          optionId: selectedOption.id 
        }
      });
      
      // Update the used budget to ensure budget summary is correct
      // The total used budget is the sum of all decisions costs
      const usedBudget = Object.entries({
        ...groupDecisions,
        [category.id]: selectedOption.id
      }).reduce((total, [catId, optId]) => {
        const cat = policyCategories.find(c => c.id === Number(catId));
        const opt = cat?.options.find(o => o.id === optId);
        return total + (opt?.cost || 0);
      }, 0);
      
      // Update user's remaining budget
      dispatch({
        type: 'UPDATE_USER_INFO',
        payload: { 
          remainingBudget: 14 - usedBudget
        }
      });
      
      // Add results message
      const resultsMessage: MessageType = {
        id: Date.now() + Math.random() * 1000,
        text: votingResultsText,
        sender: 'System',
        isUser: false,
        timestamp: Date.now()
      };
      
      setMessages(prev => {
        // Check for duplicates
        if (prev.some(msg => 
          msg.sender === 'System' && 
          msg.text.includes(`Based on our discussion, the committee has agreed on`)
        )) {
          return prev;
        }
        return [...prev, resultsMessage];
      });
      
      // Move to next category
      setTimeout(() => {
        // Clear voting flag for next category
        localStorage.removeItem('votingTriggered');
        
        const nextCategoryIndex = currentCategory + 1;
        
        if (nextCategoryIndex < policyCategories.length) {
          setCurrentCategory(nextCategoryIndex);
          setCurrentStep('discussion');
          
          const nextMessage: MessageType = {
            id: Date.now() + Math.random() * 1000,
            text: `Now, let's discuss ${policyCategories[nextCategoryIndex].name}. What do you think about this topic?`,
            sender: 'System',
            isUser: false,
            timestamp: Date.now()
          };
          
          setMessages(prev => {
            // Check for duplicates
            if (prev.some(msg => 
              msg.sender === 'System' && 
              msg.text.includes(`Let's discuss ${policyCategories[nextCategoryIndex].name}`)
            )) {
              return prev;
            }
            return [...prev, nextMessage];
          });
        } else {
          // Finished all categories
          setCurrentStep('results');
          
          const summaryMessage: MessageType = {
            id: Date.now() + Math.random() * 1000,
            text: `We've completed our discussion of all policy areas. Thank you for your participation in this important dialogue about refugee education.`,
            sender: 'System',
            isUser: false,
            timestamp: Date.now()
          };
          
          setMessages(prev => {
            // Check for duplicates
            if (prev.some(msg => 
              msg.sender === 'System' && 
              msg.text.includes(`We've completed our discussion of all policy areas`)
            )) {
              return prev;
            }
            return [...prev, summaryMessage];
          });
        }
      }, 1500);
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
      
      <Container maxWidth="md">
        <Box sx={{ my: 2 }}>
          <Typography variant="h5" align="center" gutterBottom>
            <span style={{ fontWeight: 'bold', color: theme.palette.primary.main }}>Phase 2: </span> 
            Group Discussion
          </Typography>
          
          {/* Content box with smaller heading and less padding */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            mt: 1
          }}>
            {/* Left panel for chat */}
            <Box sx={{ width: { xs: '100%', md: '70%' } }}>
              {/* Chat box */}
              <Paper elevation={2} ref={chatContainerRef}
                sx={{ 
                  height: 'calc(100vh - 200px)', 
                  overflowY: 'auto', 
                  mb: 1,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(0,0,0,0.05)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: '4px',
                  }
                }}
              >
                {messages.length === 0 ? (
                  // Show this when no messages are available
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    p: 2,
                    textAlign: 'center',
                    opacity: 0.7
                  }}>
                    <ChatIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h6" color="primary.light" gutterBottom>
                      Welcome to the Discussion Phase
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, maxWidth: '80%' }}>
                      Your conversation with the agents will appear here.
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
                      size="small"
                      sx={{ mt: 1 }}
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
                        initial={{ opacity: 0, x: msg.isUser ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {msg.isUser ? (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            mb: 1.5,
                            maxWidth: '100%'
                          }}>
                            <Paper
                              sx={{
                                p: 1.5,
                                maxWidth: '85%',
                                bgcolor: 'primary.main',
                                color: 'white',
                                borderRadius: '12px 12px 0 12px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                              }}
                            >
                              <Typography variant="body1" sx={{ fontSize: '0.95rem' }}>{msg.text}</Typography>
                            </Paper>
                          </Box>
                        ) : (
                          msg.agent ? (
                            <Box sx={{ display: 'flex', mb: 1.5, maxWidth: '100%' }}>
                              <Avatar
                                src={msg.agent.avatar}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  mr: 1,
                                  bgcolor: getStanceColor(msg.agent.politicalStance),
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                                }}
                              >
                                {msg.agent.name && msg.agent.name.charAt(0)}
                              </Avatar>
                              <Box sx={{ maxWidth: 'calc(100% - 48px)' }}>
                                <Typography 
                                  variant="subtitle2" 
                                  sx={{ 
                                    mb: 0.5,
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  {msg.agent.name}
                                </Typography>
                                <Paper 
                                  elevation={1} 
                                  sx={{ 
                                    p: 1.5, 
                                    borderRadius: '8px', 
                                    backgroundColor: 'background.paper',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                                  }}
                                >
                                  <Typography variant="body1" sx={{ 
                                    fontSize: '0.95rem',
                                    lineHeight: 1.4,
                                    whiteSpace: 'pre-wrap'
                                  }}>
                                    {/* Remove "Mira sotela!" from the text if it exists */}
                                    {msg.text.replace(/Mira sotela!/g, '')}
                                  </Typography>
                                </Paper>
                              </Box>
                            </Box>
                          ) : (
                            // For system messages that don't have an agent
                            <Box sx={{ display: 'flex', mb: 1.5, maxWidth: '100%' }}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  mr: 1,
                                  bgcolor: 'primary.dark',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                  fontSize: '0.75rem'
                                }}
                              >
                                S
                              </Avatar>
                              <motion.div
                                initial={{ scale: 0.96 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2 }}
                                style={{ maxWidth: 'calc(100% - 48px)' }}
                              >
                                <Paper
                                  sx={{
                                    p: 1.5,
                                    borderRadius: '8px',
                                    bgcolor: 'rgba(30, 30, 60, 0.85)',
                                    color: 'white',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                                  }}
                                >
                                  <Typography 
                                    variant="subtitle1" 
                                    fontWeight="bold" 
                                    sx={{ 
                                      mb: 0.5,
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    System
                                  </Typography>
                                  <Typography 
                                    variant="body1" 
                                    sx={{ 
                                      whiteSpace: 'pre-wrap',
                                      fontSize: '0.95rem',
                                      lineHeight: 1.4
                                    }}
                                  >
                                    {msg.text}
                                  </Typography>
                                </Paper>
                              </motion.div>
                            </Box>
                          )
                        )}
                      </motion.div>
                    ))}
                    
                    {/* Typing indicator */}
                    {processingResponse && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: 0.5, mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            Agent is typing
                          </Typography>
                          <motion.div
                            animate={{ 
                              opacity: [0.4, 1, 0.4],
                              y: [0, -3, 0] 
                            }}
                            transition={{ 
                              duration: 1.2,
                              repeat: Infinity,
                              ease: "easeInOut" 
                            }}
                            style={{ marginLeft: 4 }}
                          >
                            •••
                          </motion.div>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
                
                {/* Input area */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1,
                    py: 1,
                    mt: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Type your message..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '18px',
                          fontSize: '0.95rem',
                          py: 0.5
                        }
                      }}
                    />
                    <IconButton
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={!userInput.trim() || processingResponse}
                      sx={{ p: 1 }}
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </motion.div>
              </Paper>
            </Box>
            
            {/* Right panel with policy info and voting */}
            <Box sx={{ width: { xs: '100%', md: '30%' } }}>
              {/* Current policy info */}
              <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 'bold', 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 1,
                  fontSize: '0.95rem'
                }}>
                  <GroupsIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Current Topic
                </Typography>
                
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '0.9rem' }}>
                  {category?.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.85rem', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                  {category?.options?.[0]?.description?.substring(0, 150) || 'Discuss policy options for refugee education.'}
                  {category?.options?.[0]?.description && category.options[0].description.length > 150 && '...'}
                </Typography>
              </Paper>
              
              {/* Voting section */}
              {currentStep === 'voting' && (
                <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 'bold', 
                    display: 'flex', 
                    alignItems: 'center',
                    mb: 1,
                    fontSize: '0.95rem'
                  }}>
                    <HowToVoteIcon sx={{ mr: 1, fontSize: '1rem' }} />
                    Vote on {category?.name}
                  </Typography>
                  
                  {/* Show policy options for voting */}
                  <Box sx={{ mt: 1, mb: 2 }}>
                    {category.options.map(option => (
                      <Box 
                        key={option.id}
                        sx={{ 
                          p: 1.5, 
                          mb: 1, 
                          borderRadius: '6px',
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
                        <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {option.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                          Cost: {option.cost} budget units
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  {processingVotes ? (
                    <Box sx={{ width: '100%', mt: 1 }}>
                      <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                        Tallying votes...
                      </Typography>
                      <LinearProgress color="secondary" sx={{ height: 4, borderRadius: 2 }} />
                    </Box>
                  ) : (
                    <Button 
                      variant="contained" 
                      color="secondary" 
                      fullWidth 
                      onClick={handleVote}
                      size="medium"
                      sx={{ 
                        mt: 1,
                        py: 1,
                        fontWeight: 'bold'
                      }}
                    >
                      Submit Vote
                    </Button>
                  )}
                </Paper>
              )}
              
              {/* Budget summary */}
              <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 'bold', 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 1,
                  fontSize: '0.95rem'
                }}>
                  <HowToVoteIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Budget Summary
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                  Remaining budget: <span style={{ fontWeight: 'bold', color: theme.palette.primary.main }}>{user.remainingBudget}</span> of 14 units
                </Typography>
                
                <LinearProgress 
                  variant="determinate" 
                  value={(user.remainingBudget / 14) * 100} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Paper>
              
              {/* Participants panel - now moved below budget summary */}
              <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 'bold', 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 1,
                  fontSize: '0.95rem'
                }}>
                  <PeopleIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Participants
                </Typography>
                
                {agents.map((agent) => (
                  <Box key={agent.id} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 0.75,
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    pb: 0.5,
                    overflow: 'hidden'
                  }}>
                    <Avatar 
                      src={agent.avatar}
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        mr: 1,
                        flexShrink: 0,
                        fontSize: '0.75rem',
                        bgcolor: getStanceColor(agent.politicalStance)
                      }}
                    >
                      {agent.name.charAt(0)}
                    </Avatar>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '0.85rem',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%'
                      }}
                    >
                      {agent.name}
                    </Typography>
                  </Box>
                ))}
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  overflow: 'hidden' 
                }}>
                  <Avatar 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      mr: 1,
                      flexShrink: 0,
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.primary.main
                    }}
                  >
                    Y
                  </Avatar>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.85rem',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%'
                    }}
                  >
                    You
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Container>
    </motion.div>
  );
};

export default Phase2; 