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
  
  // Reference for the reset button
  const resetRef = useRef<HTMLButtonElement>(null);

  // Add direct handler for forcing voting state
  const forceVotingState = () => {
    console.log('Forcing transition to voting state');
    setCurrentStep('voting');
    
    // Add system message acknowledging the transition
    const votingMessage: MessageType = {
      id: Date.now() + Math.random() * 1000,
      text: `Let's proceed to voting on ${policyCategories[currentCategory].name}.`,
      sender: 'System',
      isUser: false,
      timestamp: Date.now()
    };
    
    setMessages(prev => {
      // Only add if there isn't already a similar message
      if (!prev.some(msg => 
        msg.sender === 'System' && 
        msg.text.includes(`proceed to voting`)
      )) {
        return [...prev, votingMessage];
      }
      return prev;
    });
  };
  
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
  
  // Modify handleSendMessage to ensure agents respond to each user message
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
      // Always get responses from at least 2 agents for better conversation flow
      // The first agent should be picked based on the topic/question
      // Ensure different agents respond to provide diverse perspectives
      
      // Get current policy category name
      const policyName = policyCategories[currentCategory]?.name || "refugee education";
      
      // Check for specific topics in the user's message
      const isAboutLanguage = userInput.toLowerCase().includes('language') || 
                            policyName.toLowerCase().includes('language');
      const isAboutAccess = userInput.toLowerCase().includes('access') || 
                          userInput.toLowerCase().includes('everyone') ||
                          policyName.toLowerCase().includes('access');
      const isAskingOpinions = userInput.toLowerCase().includes('what do you') || 
                             userInput.toLowerCase().includes('thoughts') || 
                             userInput.toLowerCase().includes('think') ||
                             userInput.toLowerCase().includes('what') ||
                             userInput.toLowerCase().includes('other');
      
      // Select appropriate agents based on the topic
      let primaryAgentIndex = 0;
      
      if (isAboutLanguage) {
        // For language questions, prioritize agents with strong views on language
        primaryAgentIndex = agents.findIndex(a => 
          a.name === "Maria González" || a.name === "Dr. Sarah Chen"
        );
      } else if (isAboutAccess) {
        // For access questions, alternate between progressive and conservative views
        const lastAgent = messages
          .slice(-3)
          .find(m => !m.isUser && m.agent)?.agent?.name;
          
        primaryAgentIndex = agents.findIndex(a => 
          (lastAgent === "Dr. Sarah Chen" ? 
            a.name === "Thomas Reynolds" : 
            a.name === "Dr. Sarah Chen")
        );
      } else if (isAskingOpinions) {
        // For opinion questions, get at least two different perspectives
        primaryAgentIndex = Math.floor(Math.random() * agents.length);
      } else {
        // Default: pick the agent who hasn't spoken recently
        const recentAgents = messages
          .slice(-5)
          .filter(m => !m.isUser && m.sender !== 'System')
          .map(m => m.sender);
          
        // Find first agent not in recent speakers
        primaryAgentIndex = agents.findIndex(a => !recentAgents.includes(a.name));
        if (primaryAgentIndex === -1) primaryAgentIndex = Math.floor(Math.random() * agents.length);
      }
      
      // Ensure we have a valid primary agent
      if (primaryAgentIndex === -1) primaryAgentIndex = 0;
      
      // Create a list of agents who will respond
      const respondingAgents: Agent[] = [];
      
      // Add primary agent
      respondingAgents.push(agents[primaryAgentIndex]);
      
      // Add a second agent with a different perspective
      const secondaryAgentIndex = agents.findIndex(a => 
        a.politicalStance !== agents[primaryAgentIndex].politicalStance &&
        // Prefer agents who haven't spoken recently
        !messages
          .slice(-3)
          .filter(m => !m.isUser)
          .some(m => m.sender === a.name)
      );
      
      if (secondaryAgentIndex !== -1) {
        respondingAgents.push(agents[secondaryAgentIndex]);
      } else {
        // If we can't find an ideal second agent, pick any different agent
        const availableAgents = agents.filter((_, i) => i !== primaryAgentIndex);
        if (availableAgents.length > 0) {
          respondingAgents.push(availableAgents[Math.floor(Math.random() * availableAgents.length)]);
        }
      }
      
      // Process each responding agent sequentially with slight delays
      for (let i = 0; i < respondingAgents.length; i++) {
        const agent = respondingAgents[i];
        
        // Simulate thinking time - shorter for better flow
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 600));
        
        // Get response based on agent characteristics with topic awareness
        let response = "";
        
        // Check for specific topics in the user's message
        const isAboutLanguage = userInput.toLowerCase().includes('language') || 
                              policyName.toLowerCase().includes('language');
        
        const isAboutAccess = userInput.toLowerCase().includes('access') || 
                            policyName.toLowerCase().includes('access');
        
        const isAskingOpinions = userInput.toLowerCase().includes('what do you') || 
                               userInput.toLowerCase().includes('thoughts') || 
                               userInput.toLowerCase().includes('think') ||
                               userInput.toLowerCase().includes('what') ||
                               userInput.toLowerCase().includes('other');
        
        // Base responses on agent characteristics with topic awareness
        switch (agent.name) {
          case "Dr. Sarah Chen":
            if (isAboutLanguage) {
              response = `I believe language instruction should be inclusive. While Teanish should remain the primary language of instruction, we should offer support for refugee students in their native languages during the transition period. Multilingual education has been shown to improve long-term academic outcomes.`;
            } else if (isAboutAccess) {
              response = `I agree that access should be universal. Research shows that inclusive environments benefit both refugee and local students, fostering greater cultural understanding and preparing all students for our diverse society.`;
            } else if (isAskingOpinions) {
              response = `From my perspective as an education researcher, I support mixed classrooms with specialized support services for refugee students. This balanced approach promotes integration while addressing specific needs.`;
            } else {
              response = `I believe inclusive approaches to ${policyName} benefit all students, not just refugees. By investing in proper support services, we can help refugee students thrive in mainstream educational settings.`;
            }
            break;
            
          case "Thomas Reynolds":
            if (isAboutLanguage) {
              response = `On language instruction, I believe we should maintain Teanish as our primary language while offering targeted support for refugee students. Creating separate language programs would be costly and could slow integration into our society.`;
            } else if (isAboutAccess) {
              response = `Regarding access, we must be practical. Our existing educational framework has proven effective for generations. Modest adjustments to accommodate refugee students make more sense than complete restructuring.`;
            } else if (isAskingOpinions) {
              response = `From a practical standpoint, I favor integrating refugee students into our existing educational structures with modest support services. This approach is fiscally responsible and helps maintain academic standards.`;
            } else {
              response = `When considering ${policyName}, we must balance compassion with practical realities. Our budgetary constraints mean we should focus on enhancing existing systems rather than creating entirely new structures.`;
            }
            break;
            
          case "Maria González":
            if (isAboutLanguage) {
              response = `Language instruction should honor both Teanish and refugees' native languages. Bilingual education programs don't just help refugees – they enrich the learning environment for all students and promote cultural appreciation and exchange.`;
            } else if (isAboutAccess) {
              response = `Equal access to education is a fundamental right. We need comprehensive programs that not only allow refugee students into classrooms but provide the specialized support they need to truly succeed and feel welcomed.`;
            } else if (isAskingOpinions) {
              response = `Based on my work with refugee communities, I strongly support comprehensive support programs that address both academic and cultural needs. Education policy must center the voices of refugee families.`;
            } else {
              response = `When designing policies for ${policyName}, we must center the voices of refugee students and families. Their experiences should guide our approach to creating truly accessible education.`;
            }
            break;
            
          case "James Taylor":
            if (isAboutLanguage) {
              response = `On language instruction, I believe we need a balanced approach. While maintaining Teanish as our primary language, we should offer transitional language support for refugee students that gradually builds their Teanish proficiency.`;
            } else if (isAboutAccess) {
              response = `For access to education, I support a middle-ground approach. Integrating refugee students into mainstream classrooms with appropriate support services allows for both inclusion and specialized assistance.`;
            } else if (isAskingOpinions) {
              response = `I believe we can find practical compromises on ${policyName} that serve refugee students well while being mindful of our resources and existing educational frameworks.`;
            } else {
              response = `When addressing ${policyName}, we should aim for solutions that balance integration with specialized support. This creates an environment where all students can succeed.`;
            }
            break;
            
          default:
            response = `I think ${policyName} requires thoughtful consideration. We need to balance integration, specialized support, and responsible use of our resources.`;
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
        
        // Add shorter delay between agent responses for better conversation flow
        if (i < respondingAgents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      
      setProcessingResponse(false);
    } catch (error) {
      console.error("Error in message handling:", error);
      setProcessingResponse(false);
    }
  };
  
  // Modify the useEffect that handles when all categories have been discussed to properly transition
  useEffect(() => {
    if (typeof currentCategory === "number" && currentCategory >= policyCategories.length && currentStep === 'results') {
      // Check if we've already calculated total budget
      const totalBudget = Object.keys(groupDecisions).reduce((total, catId) => {
        const category = policyCategories.find(cat => cat.id === Number(catId));
        const option = category?.options.find(opt => opt.id === groupDecisions[Number(catId)]);
        return total + (option?.cost || 0);
      }, 0);
      
      // Add a more visible summary message
      const summaryMessage: MessageType = {
        id: Date.now() + 3,
        text: `CONGRATULATIONS! We've completed our discussion of all policy categories. Our final decisions use ${totalBudget} of our 14 budget units.`,
        sender: 'System',
        isUser: false,
        timestamp: Date.now()
      };
      
      setMessages(prevMessages => {
        // Only add if it doesn't already exist
        if (!prevMessages.some(msg => msg.text.includes("CONGRATULATIONS!"))) {
          return [...prevMessages, summaryMessage];
        }
        return prevMessages;
      });
      
      // Add another message directing the user to proceed to Phase 3
      setTimeout(() => {
        const proceedMessage: MessageType = {
          id: Date.now() + 5,
          text: `⭐ NEXT STEP: Please click the "Proceed to Phase 3: Reflection" button at the bottom of the screen to continue to the reflection phase. ⭐`,
          sender: 'System',
          isUser: false,
          timestamp: Date.now() + 100
        };
        
        setMessages(prev => {
          if (!prev.some(msg => msg.text.includes("NEXT STEP"))) {
            return [...prev, proceedMessage];
          }
          return prev;
        });
      }, 1500);
      
      // Add a visual indicator at the end of the chat
      setTimeout(() => {
        const finalInstructionMessage: MessageType = {
          id: Date.now() + 7,
          text: `Click the pulsing purple button below to proceed to Phase 3 where you'll reflect on your policy decisions.`,
          sender: 'System',
          isUser: false,
          timestamp: Date.now() + 200
        };
        
        setMessages(prev => {
          if (!prev.some(msg => msg.text.includes("pulsing purple button"))) {
            return [...prev, finalInstructionMessage];
          }
          return prev;
        });
      }, 3000);
    }
  }, [currentCategory, currentStep, groupDecisions, policyCategories]);
  
  // Implement voice input functionality that actually works
  const toggleVoiceInput = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser. Please try Chrome.");
      return;
    }
    
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      try {
        recognition.stop();
        console.log("Speech recognition stopped");
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    } else {
      // Start recording
      setIsRecording(true);
      
      // Reset handlers
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      
      // Set up handlers
      recognition.onresult = (event: any) => {
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          console.log("Recognized speech:", transcript);
          
          // Update input field with recognized text
          setUserInput(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        
        if (event.error === 'not-allowed') {
          alert("Please enable microphone permissions to use voice input.");
        }
      };
      
      recognition.onend = () => {
        console.log("Speech recognition ended");
        setIsRecording(false);
      };
      
      // Start listening
      try {
        recognition.start();
        console.log("Speech recognition started");
        
        // Auto-stop after 10 seconds as a safety
        setTimeout(() => {
          if (isRecording) {
            setIsRecording(false);
            try {
              recognition.stop();
            } catch (e) {
              console.error("Error stopping speech recognition after timeout", e);
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
  
  // Update the handleProceedToPhase3 function
  const handleProceedToPhase3 = () => {
    // Add debug logging
    console.log("handleProceedToPhase3 called");
    console.log("Current category:", currentCategory);
    console.log("Number of policy categories:", policyCategories.length);
    console.log("Current step:", currentStep);
    console.log("Group decisions:", groupDecisions);
    
    // Make sure we're showing all group decisions in logs for debugging
    Object.entries(groupDecisions).forEach(([catId, optionId]) => {
      const cat = policyCategories.find(c => c.id === Number(catId));
      const opt = cat?.options.find(o => o.id === optionId);
      console.log(`Category: ${cat?.name}, Option: ${opt?.title}, Cost: ${opt?.cost}`);
    });

    // More permissive condition: allow proceeding to Phase 3 from the last category
    if (currentCategory >= policyCategories.length - 1 || currentStep === 'results') {
      console.log("Conditions met for proceeding to Phase 3");
      
      // Create a helpful transition message
      const transitionMessage: MessageType = {
        id: Date.now() + Math.random() * 1000,
        text: `⭐ Moving to Phase 3: Reflection. Thank you for your participation! ⭐`,
        sender: 'System',
        isUser: false,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, transitionMessage]);
      
      // Add a final delay to ensure state has settled
      setTimeout(() => {
        console.log("Dispatching phase change to phase3");
        dispatch({ type: 'SET_PHASE', payload: 'phase3' });
      }, 1000);
    } else {
      console.warn("Cannot proceed to Phase 3 yet - policy discussions incomplete");
      
      // Provide a helpful message to the user
      const warningMessage: MessageType = {
        id: Date.now() + Math.random() * 1000,
        text: `You need to complete all policy discussions before proceeding to Phase 3. Please continue the current discussion.`,
        sender: 'System',
        isUser: false,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, warningMessage]);
    }
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
  
  // Add an effect to reset budget to 14 when component mounts
  useEffect(() => {
    // Reset the user's budget to 14 to ensure it starts fresh
    dispatch({
      type: 'UPDATE_USER_INFO',
      payload: { 
        remainingBudget: 14
      }
    });
  }, []); // Empty dependency array ensures this runs only once at mount

  // Add back the handleVote function that was removed
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
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              size="small" 
              color="error"
              ref={resetRef}
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
              Reset
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              color="info"
              onClick={forceVotingState}
              sx={{ fontSize: '0.7rem', py: 0.5 }}
            >
              Force Voting
            </Button>
          </Stack>
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
                {/* Game state debug info - always visible */}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 0.5,
                    borderRadius: 1,
                    bgcolor: 'rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  <Chip 
                    size="small" 
                    label={`Phase: ${currentStep}`} 
                    sx={{ 
                      fontSize: '0.7rem',
                      height: 22
                    }}
                  />
                  {currentStep !== 'voting' && (
                    <Button
                      size="small"
                      color="primary"
                      variant="outlined"
                      onClick={forceVotingState}
                      sx={{ 
                        fontSize: '0.65rem', 
                        py: 0, 
                        minWidth: 0, 
                        height: 22,
                        lineHeight: 1 
                      }}
                    >
                      Vote
                    </Button>
                  )}
                </Box>

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
                    {currentCategory >= policyCategories.length - 1 ? (
                      <>
                        <Button 
                          fullWidth
                          variant="contained"
                          color="secondary"
                          onClick={handleProceedToPhase3}
                          startIcon={<CheckCircleIcon />}
                          sx={{ py: 1.2 }}
                        >
                          Proceed to Phase 3: Reflection
                        </Button>
                        <IconButton
                          color={isRecording ? "secondary" : "default"}
                          onClick={toggleVoiceInput}
                          sx={{ p: 1 }}
                        >
                          <MicIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
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
                          color={isRecording ? "secondary" : "default"}
                          onClick={toggleVoiceInput}
                          sx={{ 
                            p: 1,
                            animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                            '@keyframes pulse': {
                              '0%': { boxShadow: '0 0 0 0 rgba(156, 39, 176, 0.4)' },
                              '70%': { boxShadow: '0 0 0 10px rgba(156, 39, 176, 0)' },
                              '100%': { boxShadow: '0 0 0 0 rgba(156, 39, 176, 0)' },
                            }
                          }}
                        >
                          <MicIcon />
                        </IconButton>
                        <IconButton
                          color="primary"
                          onClick={handleSendMessage}
                          disabled={!userInput.trim() || processingResponse}
                          sx={{ p: 1 }}
                        >
                          <SendIcon />
                        </IconButton>
                      </>
                    )}
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
                
                {currentStep !== 'voting' && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={forceVotingState}
                    sx={{ mt: 1.5, fontSize: '0.8rem' }}
                  >
                    Proceed to Voting
                  </Button>
                )}
              </Paper>
              
              {/* Add Phase 3 button when on last category */}
              {currentCategory >= policyCategories.length - 1 && (
                <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: '#f8f0ff', borderLeft: '4px solid', borderColor: 'secondary.main' }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 1 }}
                  >
                    Ready for Reflection?
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    You've reached the last policy category. When you're done, continue to the reflection phase.
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={handleProceedToPhase3}
                    startIcon={<CheckCircleIcon />}
                    sx={{ 
                      py: 1, 
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}
                  >
                    Proceed to Phase 3: Reflection
                  </Button>
                </Paper>
              )}
              
              {/* Voting section - Always show when currentStep is 'voting' */}
              {currentStep === 'voting' && category && (
                <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: 'background.paper', borderLeft: '4px solid', borderColor: 'secondary.main' }}>
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
                  
                  {/* Show policy options for voting with clearer selection UI */}
                  <Box sx={{ mt: 1, mb: 2 }}>
                    {category.options.map(option => (
                      <motion.div
                        key={option.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Box 
                          onClick={() => {
                            console.log(`Selected option ${option.id} for category ${category.id}`);
                            // Update user's policy choice for voting
                            dispatch({
                              type: 'SELECT_POLICY_OPTION',
                              payload: { categoryId: category.id, optionId: option.id }
                            });
                          }}
                          sx={{ 
                            p: 1.5, 
                            mb: 1, 
                            borderRadius: '6px',
                            backgroundColor: user.policyChoices[category.id] === option.id 
                              ? 'rgba(25, 118, 210, 0.12)' 
                              : 'transparent',
                            border: '1px solid',
                            borderLeft: '4px solid',
                            borderLeftColor: user.policyChoices[category.id] === option.id 
                              ? theme.palette.primary.main
                              : 'transparent',
                            borderColor: user.policyChoices[category.id] === option.id 
                              ? theme.palette.primary.main 
                              : theme.palette.divider,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                              {option.title}
                            </Typography>
                            
                            {user.policyChoices[category.id] === option.id && (
                              <CheckCircleIcon 
                                color="primary" 
                                sx={{ 
                                  fontSize: '1.1rem', 
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px'
                                }} 
                              />
                            )}
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                            Cost: {option.cost} budget units
                          </Typography>
                          
                          <Typography variant="body2" sx={{ 
                            mt: 0.5, 
                            fontSize: '0.8rem', 
                            color: 'text.primary',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {option.description.substring(0, 100)}
                            {option.description.length > 100 && '...'}
                          </Typography>
                        </Box>
                      </motion.div>
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
                      disabled={!user.policyChoices[category.id]}
                      size="medium"
                      sx={{ 
                        mt: 1,
                        py: 1,
                        fontWeight: 'bold'
                      }}
                    >
                      {user.policyChoices[category.id] ? 'Submit Vote' : 'Select an option'}
                    </Button>
                  )}
                  
                  {/* Debug info for voting */}
                  <Box sx={{ 
                    mt: 1, 
                    pt: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    fontSize: '0.7rem',
                    color: 'text.secondary'
                  }}>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      Selected: {user.policyChoices[category.id] || 'None'}
                    </Typography>
                  </Box>
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
                
                {/* Calculate used budget based on group decisions */}
                {(() => {
                  // Calculate used budget from group decisions
                  const usedBudget = Object.entries(groupDecisions).reduce((total, [catId, optId]) => {
                    const cat = policyCategories.find(c => c.id === Number(catId));
                    const opt = cat?.options.find(o => o.id === optId);
                    return total + (opt?.cost || 0);
                  }, 0);
                  
                  // Calculate remaining budget (out of total 14)
                  const remainingBudget = 14 - usedBudget;
                  
                  return (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                        Remaining budget: <span style={{ fontWeight: 'bold', color: theme.palette.primary.main }}>{remainingBudget}</span> of 14 units
                      </Typography>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={(remainingBudget / 14) * 100} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </>
                  );
                })()}
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

      {/* Add fixed position Proceed to Phase 3 button */}
      {(currentCategory >= policyCategories.length - 1 || currentStep === 'results') && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 30,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={handleProceedToPhase3}
            startIcon={<CheckCircleIcon />}
            sx={{
              py: 1.5,
              px: 4,
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(156, 39, 176, 0.4)' },
                '70%': { boxShadow: '0 0 0 10px rgba(156, 39, 176, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(156, 39, 176, 0)' },
              }
            }}
          >
            Proceed to Phase 3: Reflection
          </Button>
        </Box>
      )}
    </motion.div>
  );
};

export default Phase2; 