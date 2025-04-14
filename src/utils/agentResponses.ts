import { Agent, PolicyCategory } from '../types';
import { getAIResponse } from './aiService';

// Helper function to get a policy option's title and cost by ID
const getOptionDetails = (category: PolicyCategory, optionId: number) => {
  const option = category.options.find(opt => opt.id === optionId);
  return option ? { title: option.title, cost: option.cost } : { title: 'Unknown Option', cost: 0 };
};

// Generate a response for each agent type about a specific policy choice
export const generatePolicyResponse = (
  agent: Agent,
  category: PolicyCategory,
  userChoice: number
): string => {
  const { name, politicalStance } = agent;
  const { name: categoryName } = category;
  
  // Generate response based on political stance and the user's choice
  if (politicalStance === 'Conservative') {
    if (userChoice === 1) {
      return `I agree with your choice on ${categoryName}. A conservative approach is what our education system needs. We must be careful not to overextend our resources or disrupt our existing successful frameworks.`;
    } else if (userChoice === 2) {
      return `While I appreciate your moderate stance on ${categoryName}, I would prefer a more restrained approach. We need to be cautious about implementing changes that could strain our resources or undermine our educational standards.`;
    } else {
      return `I must respectfully disagree with your choice on ${categoryName}. Such progressive policies often come with unforeseen costs and complications. A more measured approach would better serve all stakeholders in our education system.`;
    }
  } else if (politicalStance === 'Liberal') {
    if (userChoice === 1) {
      return `I understand your cautious approach to ${categoryName}, but I believe we need more progressive measures. Our refugee students deserve greater support to ensure they have equal opportunities to succeed.`;
    } else if (userChoice === 2) {
      return `Your balanced approach to ${categoryName} has merit. While I might push for slightly more comprehensive support, I appreciate your commitment to sustainable progress in our education system.`;
    } else {
      return `I couldn't agree more with your progressive stance on ${categoryName}. Investing in robust support systems now will yield tremendous benefits for both refugee students and our broader community in the long run.`;
    }
  } else if (politicalStance === 'Socialist') {
    if (userChoice === 1) {
      return `I strongly disagree with this conservative approach to ${categoryName}. Our refugee population deserves full access to resources and support. We must prioritize equity and inclusion, even if it requires significant investment.`;
    } else if (userChoice === 2) {
      return `While your approach to ${categoryName} shows some consideration for refugee needs, I believe we should go further. True equity requires bold action and comprehensive support for those most marginalized in our education system.`;
    } else {
      return `Your progressive choice on ${categoryName} aligns perfectly with our values of solidarity and equity! When we invest fully in supporting refugee education, we create a more just and thriving society for everyone.`;
    }
  } else { // Moderate or other stances
    if (userChoice === 1) {
      return `I see the pragmatic aspects of your conservative approach to ${categoryName}, though I wonder if we might find a middle ground that provides additional support where most needed while remaining fiscally responsible.`;
    } else if (userChoice === 2) {
      return `I appreciate your balanced approach to ${categoryName}. Finding this middle ground allows us to improve support for refugee students while maintaining a sustainable system that works for everyone.`;
    } else {
      return `Your progressive stance on ${categoryName} is admirable, though we should ensure implementation is practical and sustainable. I support the direction while advocating for measured steps that bring everyone along.`;
    }
  }
};

// Generate general opening statements based on agent profile
export const generateOpeningStatement = (agent: Agent): string => {
  // Create more engaging personalized introductions based on agent's political stance and background
  const { name, age, occupation, education, politicalStance } = agent;
  
  let introduction = '';
  
  if (politicalStance === 'Liberal') {
    introduction = `Greetings, esteemed colleagues. I am ${name}, a ${age}-year-old ${occupation} with ${education}, and I have the honor of serving as a member of parliament in the Republic of Bean. My political stance is firmly rooted in liberal values, advocating for inclusive policies, particularly in the realm of refugee education. I believe that fostering a nurturing environment for all learners, regardless of their background, is crucial for the enrichment of our society and the growth of our democratic principles. Let us cultivate understanding and opportunity through education!`;
  } 
  else if (politicalStance === 'Conservative') {
    introduction = `Ladies and gentlemen, I am ${name}, a ${age}-year-old ${occupation} with a background in ${education}. As a representative in the Republic of Bean's parliament with conservative principles, I am committed to preserving our traditional values while addressing the challenges of refugee education policy. I believe that any reforms must maintain the integrity of our existing educational system and ensure fiscal responsibility. I look forward to a thoughtful discussion that balances compassion with pragmatism.`;
  }
  else if (politicalStance === 'Socialist') {
    introduction = `Hello everyone! I am ${name}, a passionate ${age}-year-old ${occupation} with ${education}. As a proud socialist member of parliament in the Republic of Bean, I advocate tirelessly for the rights of all people, especially our refugee population. I believe education is a fundamental right that must be accessible to everyone regardless of their background. It's time for bold, progressive policies that uplift the marginalized and create a more equitable society for all—because when everyone thrives, our whole community benefits!`;
  }
  else { // Moderate or other stances
    introduction = `Greetings, esteemed colleagues. I am ${name}, a ${age}-year-old ${occupation} with ${education}. As a moderate voice in the Republic of Bean's parliament, I seek balanced approaches to refugee education policy that unite rather than divide. I believe we must find pragmatic solutions that respect our traditions while embracing necessary changes for our evolving society. I look forward to collaborating with all of you to craft thoughtful policies that serve our entire community.`;
  }
  
  return introduction;
};

// Generate group consensus messages
export const generateConsensusMessage = (categoryName: string, decisionTitle: string): string => {
  return `After careful discussion and voting, the group has reached a consensus on ${categoryName}. The selected policy is: ${decisionTitle}. This decision reflects our collective wisdom and commitment to creating effective refugee education policies.`;
};

// NEW FUNCTION: Generate AI-powered policy response
export const generateAIPolicyResponse = async (
  agent: Agent,
  category: PolicyCategory,
  userChoice: number
): Promise<string> => {
  try {
    // Get the option the user selected
    const userOption = category.options.find(opt => opt.id === userChoice);
    if (!userOption) return "I couldn't determine your policy choice.";
    
    // Get the option the agent selected
    const agentChoice = agent.policyChoices[category.id];
    const agentOption = agentChoice ? category.options.find(opt => opt.id === agentChoice) : null;
    
    // Determine the character type based on political stance
    const character = agent.politicalStance.toLowerCase() === 'conservative' ? 'opponent' : 
                     agent.politicalStance.toLowerCase() === 'socialist' ? 'ally' : 'guide';
    
    // Create a more conversational prompt for the AI
    const prompt = `You are ${agent.name}, a ${agent.age}-year-old ${agent.occupation} with a ${agent.politicalStance} political stance in the Republic of Bean parliament.
    
    The group is discussing the "${category.name}" policy for refugee education.
    
    The user has selected "${userOption.title}": ${userOption.description}
    
    Your own preference is ${agentOption ? `"${agentOption.title}": ${agentOption.description}` : "undecided"}.
    
    IMPORTANT:
    1. Respond with your perspective on the user's policy choice in 2-3 conversational sentences
    2. Start with a natural response like "I think..." or "In my view..." 
    3. Include a personal opinion or real-world connection
    4. Stay in character with your political stance
    5. DO NOT mention Professor Beanington
    6. If you agree with the user, explain why
    7. If you disagree, express your concerns politely`;
    
    // Get the AI response
    const response = await getAIResponse(prompt, character);
    return response;
    
  } catch (error) {
    console.error("Error generating AI policy response:", error);
    // Fall back to template-based response if AI fails
    return generatePolicyResponse(agent, category, userChoice);
  }
};

// Enhanced function to ensure proper agent identity in introductions
export const generateAIOpeningStatement = async (agent: Agent): Promise<string> => {
  try {
    // Create the prompt for the AI with explicit identity instructions
    const prompt = `You are ${agent.name}, a ${agent.age}-year-old ${agent.occupation} with ${agent.education} and a ${agent.politicalStance} political stance. 
    Introduce yourself to the group as a member of parliament in the Republic of Bean discussing refugee education policy reform.
    
    IMPORTANT INSTRUCTIONS:
    1. You MUST speak in first person AS ${agent.name} and never as any other character
    2. NEVER respond as Professor Beanington or mention Professor Beanington
    3. Begin your introduction with "I am ${agent.name}" or "My name is ${agent.name}"
    4. Mention your background and political perspective in 2-3 sentences
    5. Use natural, conversational language
    6. Keep your response brief and engaging`;
    
    // Determine which character type to use based on political stance
    let characterType: 'guide' | 'opponent' | 'ally' = 'guide';
    
    if (agent.politicalStance === 'Conservative') {
      characterType = 'opponent';
    } else if (['Progressive', 'Socialist'].includes(agent.politicalStance)) {
      characterType = 'ally';
    } else if (agent.politicalStance === 'Moderate') {
      characterType = 'guide';
    }
    
    console.log(`Generating introduction for ${agent.name} as ${characterType} stance`);
    
    // Get the AI response
    const response = await getAIResponse(prompt, characterType);
    
    // Verify response doesn't contain identity confusion
    const hasIdentityConfusion = 
      /professor beanington/i.test(response) || 
      /as your guide/i.test(response) || 
      /as a guide/i.test(response) ||
      !new RegExp(`I am ${agent.name}|My name is ${agent.name}`, 'i').test(response);
    
    if (hasIdentityConfusion) {
      console.warn(`Identity confusion detected in ${agent.name}'s introduction. Using fallback.`);
      // Create a more reliable fallback that explicitly includes the name
      return `I am ${agent.name}, a ${agent.age}-year-old ${agent.occupation} with experience in ${agent.education}. As a ${agent.politicalStance} member of parliament in the Republic of Bean, I'm committed to developing effective refugee education policies that align with my values.`;
    }
    
    return response;
  } catch (error) {
    console.error("Error generating AI opening statement:", error);
    // Fall back to template-based intro if AI fails
    return generateOpeningStatement(agent);
  }
};

// NEW FUNCTION: Generate AI-powered consensus message
export const generateAIConsensusMessage = async (
  categoryName: string, 
  decisionTitle: string,
  decisionDescription: string
): Promise<string> => {
  try {
    // Create a more varied prompt for the AI
    const prompt = `As the moderator of a parliamentary discussion, announce that the group has reached a consensus on "${categoryName}" policy for refugee education.
    
    The group has selected "${decisionTitle}": ${decisionDescription}
    
    IMPORTANT:
    1. Explain the consensus in 2-3 sentences
    2. Highlight the democratic process
    3. Use a positive, encouraging tone
    4. Mention how this decision balances different perspectives
    5. Use natural, conversational language
    6. Occasionally include phrases like "sprouting ideas" or "cultivating solutions" to add character`;
    
    // Get the AI response
    const response = await getAIResponse(prompt, 'guide');
    return response;
    
  } catch (error) {
    console.error("Error generating AI consensus message:", error);
    // Fall back to template-based message if AI fails
    return generateConsensusMessage(categoryName, decisionTitle);
  }
}; 