import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, Agent, User } from '../types';
import { policyCategories } from '../data/policyData';
import { agentProfiles } from '../data/agentProfiles';

// Use agent profiles from data file for consistent experience
const initialAgents: Agent[] = agentProfiles.map(agent => ({
  ...agent,
  // Reset policy choices for new game
  policyChoices: {},
  remainingBudget: 14
}));

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
      // For each AI agent, select policies based on their political stance with some randomness
      const updatedAgents = state.agents.map(agent => {
        const policyChoices: Record<number, number> = {};
        let remainingBudget = 14;
        
        // Create a priority order for categories based on agent's stance
        // This determines which categories they'll prefer to spend more on
        const categoriesByPriority = [...state.policyCategories];
        
        // Shuffle the categories with some bias based on political stance
        categoriesByPriority.sort(() => {
          // Add some randomness but still maintain coherent preference patterns
          return (Math.random() - 0.3) * 2; // Biased random
        });
        
        // Conservative and Moderate agents prioritize spending less
        // Socialist and Liberal agents prioritize higher impact options
        
        // Define preference matrices for different political stances
        // Values represent tendency to choose option 1, 2, or 3
        const preferenceMatrix: Record<string, number[]> = {
          Conservative: [0.7, 0.25, 0.05], // Strong preference for option 1 (cheapest)
          Liberal: [0.2, 0.6, 0.2],        // Preference for option 2 (balanced)
          Socialist: [0.05, 0.25, 0.7],    // Strong preference for option 3 (most comprehensive)
          Moderate: [0.35, 0.5, 0.15]      // Balanced with slight preference for options 1-2
        };
        
        // Get the preference array for this agent's stance
        const preferenceWeights = preferenceMatrix[agent.politicalStance] || [0.33, 0.34, 0.33];
        
        // First pass: select preferred options without budget constraints
        const initialSelections: Record<number, number> = {};
        
        categoriesByPriority.forEach(category => {
          // Select an option based on the agent's political stance with randomness
          const rand = Math.random();
          let selectedIndex: number;
          
          if (rand < preferenceWeights[0]) {
            selectedIndex = 0; // Option 1
          } else if (rand < preferenceWeights[0] + preferenceWeights[1]) {
            selectedIndex = 1; // Option 2
          } else {
            selectedIndex = 2; // Option 3
          }
          
          initialSelections[category.id] = category.options[selectedIndex].id;
        });
        
        // Second pass: adjust selections to fit budget constraints
        // Calculate total cost of initial selections
        let totalCost = 0;
        Object.entries(initialSelections).forEach(([categoryId, optionId]) => {
          const category = state.policyCategories.find(cat => cat.id === Number(categoryId));
          const option = category?.options.find(opt => opt.id === optionId);
          if (option) {
            totalCost += option.cost;
          }
        });
        
        // If total cost exceeds budget, adjust selections starting from lowest priority
        if (totalCost > 14) {
          // Work through categories in reverse priority order
          for (let i = categoriesByPriority.length - 1; i >= 0; i--) {
            const category = categoriesByPriority[i];
            const currentOptionId = initialSelections[category.id];
            const currentOption = category.options.find(opt => opt.id === currentOptionId);
            
            if (!currentOption) continue;
            
            // Try to downgrade to a cheaper option if available
            const currentIndex = category.options.findIndex(opt => opt.id === currentOptionId);
            
            // If we're already at option 1 (cheapest), skip this category
            if (currentIndex === 0) continue;
            
            // Try a cheaper option
            const cheaperOption = category.options[currentIndex - 1];
            const potentialSavings = currentOption.cost - cheaperOption.cost;
            
            // Update the selection and total cost
            initialSelections[category.id] = cheaperOption.id;
            totalCost -= potentialSavings;
            
            // If we're now under budget, we can stop
            if (totalCost <= 14) {
              break;
            }
          }
        }
        
        // If we still exceed budget after downgrades, prioritize fewer categories
        if (totalCost > 14) {
          console.log(`Agent ${agent.name} couldn't fit preferences in budget, prioritizing categories`);
          
          // Sort categories by how "important" they are to this agent based on stance
          const stancePriorities: Record<string, number[]> = {
            Conservative: [1, 2, 7, 3, 4, 5, 6], // Example priority order
            Liberal: [2, 1, 4, 7, 5, 3, 6],
            Socialist: [2, 5, 1, 7, 4, 6, 3],
            Moderate: [1, 4, 2, 3, 7, 5, 6]
          };
          
          const priorityOrder = stancePriorities[agent.politicalStance] || 
                               categoriesByPriority.map(c => c.id);
          
          // Clear selections and add them back one by one until we hit budget limit
          const refinedSelections: Record<number, number> = {};
          totalCost = 0;
          
          for (const categoryId of priorityOrder) {
            const category = state.policyCategories.find(cat => cat.id === categoryId);
            if (!category) continue;
            
            const optionId = initialSelections[category.id];
            const option = category.options.find(opt => opt.id === optionId);
            
            if (!option) continue;
            
            // Only add if it fits in remaining budget
            if (totalCost + option.cost <= 14) {
              refinedSelections[category.id] = optionId;
              totalCost += option.cost;
            } else {
              // Try cheaper options if available
              for (let i = 0; i < category.options.length; i++) {
                const cheaperOption = category.options[i];
                if (totalCost + cheaperOption.cost <= 14) {
                  refinedSelections[category.id] = cheaperOption.id;
                  totalCost += cheaperOption.cost;
                  break;
                }
              }
            }
          }
          
          // Final safety check - if we still have empty categories and budget,
          // fill with the cheapest options
          state.policyCategories.forEach(category => {
            if (!refinedSelections[category.id] && totalCost < 14) {
              const cheapestOption = category.options[0]; // Option 1 is cheapest
              if (totalCost + cheapestOption.cost <= 14) {
                refinedSelections[category.id] = cheapestOption.id;
                totalCost += cheapestOption.cost;
              }
            }
          });
          
          // Replace our selections with refined ones
          Object.assign(policyChoices, refinedSelections);
          remainingBudget = 14 - totalCost;
        } else {
          // If everything fits, use our initial selections
          Object.assign(policyChoices, initialSelections);
          remainingBudget = 14 - totalCost;
        }
        
        // Log each agent's choices for debugging
        console.log(`Agent ${agent.name} (${agent.politicalStance}) selections:`, 
                   Object.entries(policyChoices).map(([catId, optId]) => {
                     const cat = state.policyCategories.find(c => c.id === Number(catId));
                     const opt = cat?.options.find(o => o.id === optId);
                     return `${cat?.name}: Option ${optId} (${opt?.cost} units)`;
                   }));
        
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