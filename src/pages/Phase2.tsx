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
  
  // Add a useEffect cleanup to fix the state persistence issue
  useEffect(() => {
    // Restore scrolling to the top when component mounts
    window.scrollTo(0, 0);
    
    // Cleanup function for when component unmounts
    return () => {
      // Clear all localStorage flags to ensure proper reinitialization
      localStorage.removeItem('discussionInitialized');
      localStorage.removeItem('introCompleted');
      sessionStorage.clear();
    };
  }, []);

  // Also add a key tracking mechanism to avoid duplicates
  const [processedKeys, setProcessedKeys] = useState<Set<string>>(new Set());

  // Add this function to track processed agent IDs
  const markAgentAsProcessed = (agentId: number) => {
    const key = `agent-intro-${agentId}`;
    if (!processedKeys.has(key)) {
      setProcessedKeys(new Set(processedKeys).add(key));
      return true;
    }
    return false;
  };

  // Add this function to check if an agent has been processed
  const hasAgentBeenProcessed = (agentId: number) => {
    return processedKeys.has(`agent-intro-${agentId}`);
  };
  
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
        
        // Generate a unique message ID
        const generateUniqueId = () => Date.now() + Math.random() * 1000;
        
        // Create initial message array
        const initialMessages: MessageType[] = [];
        
        // Add system intro message
        initialMessages.push({
          id: generateUniqueId(),
          text: "Welcome to the group discussion phase. Each of the AI agents will introduce themselves, and then you can discuss each policy area to reach consensus.",
          sender: 'System',
          isUser: false,
          timestamp: Date.now()
        });
        
        // Add agent introduction message
        initialMessages.push({
          id: generateUniqueId(),
          text: "Let me introduce you to your discussion partners...",
          sender: 'System',
          isUser: false,
          timestamp: Date.now() + 100
        });
        
        // Set all initial messages at once
        setMessages(initialMessages);
        
        // Add each agent introduction with a delay
        for (let i = 0; i < agents.length; i++) {
          const agent = agents[i];
          
          // Skip if this agent has already been processed
          if (hasAgentBeenProcessed(agent.id)) continue;
          
          // Mark this agent as processed
          markAgentAsProcessed(agent.id);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            // Get agent introduction text
            let introText = '';
            try {
              // Try to get AI-generated introduction
              introText = await generateAIOpeningStatement(agent);
              console.log(`Generated AI introduction for ${agent.name}`);
            } catch (error) {
              console.error(`Error generating AI intro for ${agent.name}:`, error);
              // Fallback to template-based intro
              introText = generateOpeningStatement(agent);
            }
            
            // Add agent message
            const agentMessage: MessageType = {
              id: generateUniqueId(),
              text: introText,
              sender: agent.name,
              isUser: false,
              avatar: agent.avatar,
              timestamp: Date.now()
            };
            
            // Add to messages
            setMessages(prevMessages => [...prevMessages, agentMessage]);
            
            // Short pause between introductions
            await new Promise(resolve => setTimeout(resolve, 800));
          } catch (error) {
            console.error(`Error processing agent ${agent.name}:`, error);
          }
        }
        
        // Add message to start discussion after all introductions
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const startDiscussionMessage: MessageType = {
          id: generateUniqueId(),
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
    
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setProcessingResponse(true);
    
    try {
      // Determine which agent should respond based on discussion step
      // Let's rotate through all agents randomly but ensure different agents respond
      const recentRespondents = messages
        .slice(-3)
        .filter(m => !m.isUser && m.sender !== 'System')
        .map(m => m.sender);
      
      // Filter out agents who just responded
      const availableAgents = agents.filter(agent => 
        !recentRespondents.includes(agent.name)
      );
      
      // If all agents recently responded, just pick randomly
      const agentPool = availableAgents.length > 0 ? availableAgents : agents;
      const respondingAgent = agentPool[Math.floor(Math.random() * agentPool.length)];
      
      // Get AI response based on current category and user input
      const promptContext = `The discussion is about ${policyCategories[currentCategory]?.name}. 
      The user said: "${userInput}"
      Respond as ${respondingAgent.name}, a ${respondingAgent.politicalStance} politician with a background in ${respondingAgent.occupation}.
      Keep your response concise (2-3 sentences) and focused on the policy discussion.`;
      
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
        id: Date.now() + Math.random() * 1000,
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
        
        // After a certain number of messages, prompt for voting on the current policy
        const userMessagesCount = messages.filter(m => m.isUser).length;
        
        if (userMessagesCount >= 2 && currentStep !== 'voting') {
          setTimeout(() => {
            // Add voting prompt message
            const votingPromptMessage: MessageType = {
              id: Date.now() + Math.random() * 1000,
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
  
  // Improved vote handling to ensure all agents participate
  const handleVote = () => {
    setProcessingVotes(true);
    
    // Collect votes from user and all agents
    const newVotes: Record<number, number> = {};
    
    // User's vote - use their selected policy
    const userChoice = user.policyChoices[category.id];
    if (userChoice) {
      newVotes[userChoice] = 1;
      console.log(`User voted for option ${userChoice} in category ${category.name}`);
    }
    
    // Agent votes - make sure each agent casts a vote based on their preferences
    agents.forEach(agent => {
      // Check if agent has a preference for this category
      const agentChoice = agent.policyChoices[category.id];
      
      if (agentChoice) {
        newVotes[agentChoice] = (newVotes[agentChoice] || 0) + 1;
        console.log(`${agent.name} voted for option ${agentChoice} in category ${category.name}`);
      } else {
        // If agent doesn't have a preference, assign one based on political stance
        let fallbackChoice = 2; // Default to middle option
        
        switch (agent.politicalStance) {
          case 'Conservative':
            fallbackChoice = 1; // Lowest cost option
            break;
          case 'Progressive':
          case 'Socialist':
            fallbackChoice = 3; // Highest investment option
            break;
          default:
            fallbackChoice = 2; // Moderate option
        }
        
        // Make sure option exists for this category
        const options = category.options;
        if (options.some(opt => opt.id === fallbackChoice)) {
          newVotes[fallbackChoice] = (newVotes[fallbackChoice] || 0) + 1;
          console.log(`${agent.name} voted for fallback option ${fallbackChoice} in category ${category.name}`);
        } else if (options.length > 0) {
          // Just use the first available option
          const firstOption = options[0].id;
          newVotes[firstOption] = (newVotes[firstOption] || 0) + 1;
          console.log(`${agent.name} voted for first available option ${firstOption} in category ${category.name}`);
        }
      }
    });
    
    setVotes(newVotes);
    console.log("Final votes:", newVotes);
    
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
        const randomIndex = Math.floor(Math.random() * tiedOptions.length);
        winningOption = tiedOptions[randomIndex];
        console.log(`Tie detected! Randomly selected option ${winningOption} from ${tiedOptions.join(', ')}`);
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
          // Add result message
          const votingResultsMessage: MessageType = {
            id: Date.now() + Math.random() * 1000,
            text: `Voting results for ${category.name}:\n` + 
                  Object.entries(newVotes).map(([option, count]) => {
                    const optionDetails = category.options.find(opt => opt.id === Number(option));
                    return `- ${optionDetails?.title}: ${count} vote${count !== 1 ? 's' : ''}`;
                  }).join('\n'),
            sender: 'System',
            isUser: false,
            timestamp: Date.now()
          };
          
          setMessages(prevMessages => [...prevMessages, votingResultsMessage]);
          
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
            id: Date.now() + Math.random() * 1000,
            text: consensusText,
            sender: 'System',
            isUser: false,
            timestamp: Date.now() + 100
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
                id: Date.now() + Math.random() * 1000,
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
          }, 2000);
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
  
  return (
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
                      mb: 2.5,
                      justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {!message.isUser && (
                      <Avatar
                        src={message.avatar}
                        sx={{ 
                          mr: 1, 
                          width: { xs: 40, md: 48 }, 
                          height: { xs: 40, md: 48 },
                          bgcolor: message.sender === 'System' 
                            ? 'primary.dark'
                            : message.sender === 'Alex'
                            ? '#00BFFF'
                            : message.sender === 'Jordan'
                            ? '#0047AB'
                            : message.sender === 'Morgan'
                            ? '#DC143C'
                            : '#9370DB',
                          boxShadow: '0 3px 6px rgba(0,0,0,0.2)'
                        }}
                      >
                        {message.sender.charAt(0)}
                      </Avatar>
                    )}
                    <Paper
                      elevation={2}
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
                        boxShadow: message.isUser
                          ? '0 4px 12px rgba(25, 118, 210, 0.3)'
                          : '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {message.sender}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          fontSize: { xs: '0.95rem', md: '1.05rem' },
                          lineHeight: 1.5
                        }}
                      >
                        {message.text}
                      </Typography>
                    </Paper>
                    {message.isUser && (
                      <Avatar 
                        sx={{ 
                          ml: 1, 
                          width: { xs: 40, md: 48 }, 
                          height: { xs: 40, md: 48 },
                          backgroundColor: 'primary.dark',
                          boxShadow: '0 3px 6px rgba(0,0,0,0.2)'
                        }}
                      >
                        You
                      </Avatar>
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
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Typing...
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Paper>
            
            {/* Input area */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Phase2; 