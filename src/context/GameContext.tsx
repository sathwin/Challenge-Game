import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, PolicyCategory, Agent, User } from '../types';
import { policyCategories } from '../data/policyData';

// Create initial agents
const initialAgents: Agent[] = [
  {
    id: 1,
    name: "Alex",
    age: 45,
    occupation: "University Professor",
    education: "PhD in Social Sciences",
    socioeconomicStatus: "Upper middle class",
    politicalStance: "Liberal",
    bio: "A thoughtful academic who believes in evidence-based approaches to social issues.",
    isAlly: true,
    policyChoices: {},
    remainingBudget: 14
  },
  {
    id: 2,
    name: "Jordan",
    age: 52,
    occupation: "Business Owner",
    education: "MBA",
    socioeconomicStatus: "Upper class",
    politicalStance: "Conservative",
    bio: "A pragmatic business leader who prioritizes fiscal responsibility and traditional values.",
    isAlly: false,
    policyChoices: {},
    remainingBudget: 14
  },
  {
    id: 3,
    name: "Morgan",
    age: 29,
    occupation: "Community Organizer",
    education: "Bachelor's in Social Work",
    socioeconomicStatus: "Lower middle class",
    politicalStance: "Socialist",
    bio: "An energetic activist dedicated to advocating for marginalized communities and social equity.",
    isAlly: true,
    policyChoices: {},
    remainingBudget: 14
  },
  {
    id: 4,
    name: "Taylor",
    age: 38,
    occupation: "Government Official",
    education: "Master's in Public Administration",
    socioeconomicStatus: "Middle class",
    politicalStance: "Moderate",
    bio: "A balanced policy expert who seeks compromise solutions that can work for diverse stakeholders.",
    isAlly: true,
    policyChoices: {},
    remainingBudget: 14
  }
];

// Initialize user object
const initialUser: User = {
  policyChoices: {},
  remainingBudget: 14
};

// Initial state of the game
const initialState: GameState = {
  phase: 'intro',
  user: initialUser,
  agents: initialAgents,
  policyCategories: policyCategories,
  groupDecisions: {},
  reflectionAnswers: {}
};

// Action types
type GameAction =
  | { type: 'SET_PHASE'; payload: GameState['phase'] }
  | { type: 'UPDATE_USER_INFO'; payload: Partial<User> }
  | { type: 'SELECT_POLICY_OPTION'; payload: { categoryId: number; optionId: number } }
  | { type: 'INITIALIZE_AI_CHOICES' }
  | { type: 'SET_GROUP_DECISION'; payload: { categoryId: number; optionId: number } }
  | { type: 'SAVE_REFLECTION_ANSWER'; payload: { questionId: string; answer: string } }
  | { type: 'RESET_GAME' };

// Create game reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_PHASE':
      return {
        ...state,
        phase: action.payload
      };
    
    case 'UPDATE_USER_INFO':
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      };
    
    case 'SELECT_POLICY_OPTION': {
      const { categoryId, optionId } = action.payload;
      const category = state.policyCategories.find(cat => cat.id === categoryId);
      
      if (!category) return state;
      
      const option = category.options.find(opt => opt.id === optionId);
      if (!option) return state;
      
      // Calculate the new budget
      const previousOption = state.user.policyChoices[categoryId];
      let newBudget = state.user.remainingBudget;
      
      if (previousOption) {
        const prevOptionCost = category.options.find(opt => opt.id === previousOption)?.cost || 0;
        newBudget += prevOptionCost;
      }
      
      newBudget -= option.cost;
      
      // Only update if the budget doesn't go negative
      if (newBudget < 0) return state;
      
      return {
        ...state,
        user: {
          ...state.user,
          policyChoices: {
            ...state.user.policyChoices,
            [categoryId]: optionId
          },
          remainingBudget: newBudget
        }
      };
    }
    
    case 'INITIALIZE_AI_CHOICES': {
      // For each AI agent, randomly select policies based on their political stance
      // This is a simplified version - in a real implementation, you'd have more sophisticated logic
      const updatedAgents = state.agents.map(agent => {
        const policyChoices: Record<number, number> = {};
        let remainingBudget = 14;
        
        // For each policy category, select an option based on the agent's political stance
        state.policyCategories.forEach(category => {
          let preferredOption;
          
          switch (agent.politicalStance) {
            case 'Conservative':
              // Conservative agents prefer less investment (Option 1)
              preferredOption = category.options[0];
              break;
            case 'Liberal':
              // Liberal agents prefer moderate choices (Option 2)
              preferredOption = category.options[1];
              break;
            case 'Socialist':
              // Socialist agents prefer more inclusive options (Option 3)
              preferredOption = category.options[2];
              break;
            case 'Moderate':
              // Moderate agents may choose a mix
              preferredOption = category.options[Math.floor(Math.random() * 2)]; // 0 or 1
              break;
            default:
              preferredOption = category.options[Math.floor(Math.random() * category.options.length)];
          }
          
          // Only select if budget allows
          if (remainingBudget >= preferredOption.cost) {
            policyChoices[category.id] = preferredOption.id;
            remainingBudget -= preferredOption.cost;
          }
        });
        
        return {
          ...agent,
          policyChoices,
          remainingBudget
        };
      });
      
      return {
        ...state,
        agents: updatedAgents
      };
    }
    
    case 'SET_GROUP_DECISION': {
      return {
        ...state,
        groupDecisions: {
          ...state.groupDecisions,
          [action.payload.categoryId]: action.payload.optionId
        }
      };
    }
    
    case 'SAVE_REFLECTION_ANSWER': {
      return {
        ...state,
        reflectionAnswers: {
          ...state.reflectionAnswers,
          [action.payload.questionId]: action.payload.answer
        }
      };
    }
    
    case 'RESET_GAME':
      return initialState;
    
    default:
      return state;
  }
};

// Create context
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Create Provider component
interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

// Create a custom hook to use the game context
export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}; 