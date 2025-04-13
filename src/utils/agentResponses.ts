import { Agent, PolicyCategory } from '../types';

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
  // Get the option the user selected
  const userOption = getOptionDetails(category, userChoice);
  
  // Get the option the agent selected
  const agentChoice = agent.policyChoices[category.id];
  const agentOption = agentChoice ? getOptionDetails(category, agentChoice) : null;
  
  // If the agent and user agree, generate a supportive response
  if (agentChoice === userChoice) {
    return generateAgreementResponse(agent, category, userOption.title);
  }
  
  // Otherwise, generate a response based on the agent's political stance and the category
  return generateDisagreementResponse(agent, category, userOption.title, agentOption?.title);
};

// Generate agreement responses
const generateAgreementResponse = (agent: Agent, category: PolicyCategory, optionTitle: string): string => {
  const agreements = [
    `I completely agree with your choice of ${optionTitle} for ${category.name}. This approach aligns well with my values.`,
    `We're on the same page regarding ${category.name}. ${optionTitle} is the right way to go.`,
    `I selected the same option for ${category.name}. ${optionTitle} is a good choice and I support it.`,
    `It's good to see we agree on ${optionTitle} for ${category.name}. This makes our consensus-building easier.`,
    `Your choice for ${category.name} is sound. I can fully back ${optionTitle}.`
  ];
  
  return agreements[Math.floor(Math.random() * agreements.length)];
};

// Generate disagreement responses based on political stance
const generateDisagreementResponse = (
  agent: Agent, 
  category: PolicyCategory, 
  userOptionTitle: string,
  agentOptionTitle: string | undefined
): string => {
  switch (agent.politicalStance.toLowerCase()) {
    case 'conservative':
      return generateConservativeDisagreement(category, userOptionTitle, agentOptionTitle);
    case 'liberal':
      return generateLiberalDisagreement(category, userOptionTitle, agentOptionTitle);
    case 'socialist':
      return generateSocialistDisagreement(category, userOptionTitle, agentOptionTitle);
    case 'moderate':
      return generateModerateDisagreement(category, userOptionTitle, agentOptionTitle);
    default:
      return `I have a different view on ${category.name}. I'd prefer ${agentOptionTitle || 'a different approach'}.`;
  }
};

// Conservative responses tend to focus on fiscal responsibility, traditional values, and gradual change
const generateConservativeDisagreement = (
  category: PolicyCategory, 
  userOptionTitle: string,
  agentOptionTitle: string | undefined
): string => {
  const conservativeResponses = [
    `I'm concerned about ${userOptionTitle} for ${category.name}. It seems to require more resources than we can responsibly allocate, especially during economic instability.`,
    `While I understand the intent behind ${userOptionTitle}, I believe ${agentOptionTitle || 'a more fiscally conservative approach'} would better serve both citizens and refugees without overburdening our systems.`,
    `I prefer a more measured approach to ${category.name}. ${userOptionTitle} appears too ambitious and could create implementation challenges without proper infrastructure.`,
    `We need to be prudent with our limited resources. ${userOptionTitle} might promise too much when we need to ensure basic stability first.`,
    `I believe in gradual integration. ${userOptionTitle} might create rapid changes that could heighten tensions rather than reduce them.`
  ];
  
  return conservativeResponses[Math.floor(Math.random() * conservativeResponses.length)];
};

// Liberal responses focus on balancing inclusive approaches with pragmatic implementation
const generateLiberalDisagreement = (
  category: PolicyCategory, 
  userOptionTitle: string,
  agentOptionTitle: string | undefined
): string => {
  const liberalResponses = [
    `I appreciate your perspective on ${category.name}, but I think ${agentOptionTitle || 'a more balanced approach'} offers better outcomes while still being fiscally responsible.`,
    `${userOptionTitle} has merits, but I wonder if we could find a middle ground that accommodates both refugee needs and system capacity.`,
    `I see the value in ${userOptionTitle}, though my preference for ${agentOptionTitle || 'an alternative'} stems from trying to balance inclusion with practical implementation.`,
    `We should aim for sustainable progress in ${category.name}. I'm not convinced ${userOptionTitle} achieves the right balance of ambition and practicality.`,
    `I believe in progressive but realistic policies. ${userOptionTitle} might need some adjustment to ensure it can be effectively implemented.`
  ];
  
  return liberalResponses[Math.floor(Math.random() * liberalResponses.length)];
};

// Socialist responses prioritize equal rights, comprehensive support, and systemic change
const generateSocialistDisagreement = (
  category: PolicyCategory, 
  userOptionTitle: string,
  agentOptionTitle: string | undefined
): string => {
  const socialistResponses = [
    `I strongly believe ${category.name} requires a more transformative approach than ${userOptionTitle}. We need to prioritize equal rights and opportunities for all.`,
    `${userOptionTitle} doesn't go far enough to address the systemic inequalities in our education system. We should be considering ${agentOptionTitle || 'more inclusive options'}.`,
    `I can't support ${userOptionTitle} when it continues to privilege citizens over refugees. Education is a human right that should be equally accessible to all.`,
    `Our commitment should be to comprehensive support for all students, regardless of origin. ${userOptionTitle} falls short of this fundamental value.`,
    `We have a moral obligation to provide the highest quality education to refugees. ${userOptionTitle} appears to compromise on this principle for budgetary convenience.`
  ];
  
  return socialistResponses[Math.floor(Math.random() * socialistResponses.length)];
};

// Moderate responses seek compromise and practical implementation
const generateModerateDisagreement = (
  category: PolicyCategory, 
  userOptionTitle: string,
  agentOptionTitle: string | undefined
): string => {
  const moderateResponses = [
    `I see both advantages and disadvantages to ${userOptionTitle} for ${category.name}. Perhaps we could find a compromise position?`,
    `While I understand your choice of ${userOptionTitle}, I wonder if ${agentOptionTitle || 'another approach'} might better balance our various concerns.`,
    `I'm looking for solutions that can gain broad support. ${userOptionTitle} has merits but might face implementation challenges we should consider.`,
    `There are valid arguments on both sides here. My preference leans toward ${agentOptionTitle || 'a different option'} because it seems more sustainable over time.`,
    `I believe we need to be pragmatic about ${category.name}. ${userOptionTitle} is an interesting choice, though I would suggest modifications to increase its feasibility.`
  ];
  
  return moderateResponses[Math.floor(Math.random() * moderateResponses.length)];
};

// Generate general opening statements based on agent profile
export const generateOpeningStatement = (agent: Agent): string => {
  switch (agent.politicalStance.toLowerCase()) {
    case 'conservative':
      return `As a ${agent.age}-year-old ${agent.occupation} with a background in ${agent.education}, I believe we need to approach refugee education with fiscal responsibility and careful integration. We should prioritize solutions that maintain stability while providing necessary support.`;
    
    case 'liberal':
      return `From my perspective as a ${agent.age}-year-old ${agent.occupation} with ${agent.education}, I believe we should find balanced solutions that promote inclusion while acknowledging practical constraints. I'll support progressive policies that can be effectively implemented.`;
    
    case 'socialist':
      return `With my experience as a ${agent.age}-year-old ${agent.occupation} and my ${agent.education} background, I'm advocating for transformative policies that prioritize equal access and comprehensive support for refugees. Education is a right, not a privilege to be rationed.`;
    
    case 'moderate':
      return `Drawing on my experiences as a ${agent.age}-year-old ${agent.occupation} with ${agent.education}, I'm looking for pragmatic solutions that can gain broad support. I believe in finding common ground and implementing policies that work in practice, not just in theory.`;
    
    default:
      return `As a ${agent.age}-year-old ${agent.occupation}, I'm approaching this discussion with an open mind. My background in ${agent.education} has taught me to consider multiple perspectives before making decisions.`;
  }
};

// Generate group consensus messages
export const generateConsensusMessage = (categoryName: string, optionTitle: string): string => {
  const consensusMessages = [
    `After careful consideration and weighing all perspectives, the group has reached a consensus on ${categoryName}. We will implement "${optionTitle}" as our collective decision.`,
    `For ${categoryName}, the majority vote supports "${optionTitle}". This represents our joint commitment to a balanced approach.`,
    `The final decision for ${categoryName} is "${optionTitle}". This reflects our collaborative effort to find a solution that addresses various concerns.`,
    `We've agreed to move forward with "${optionTitle}" for ${categoryName}. This approach incorporates input from diverse perspectives in our discussion.`,
    `Our collective decision on ${categoryName} is to implement "${optionTitle}". This represents the majority view after thorough deliberation.`
  ];
  
  return consensusMessages[Math.floor(Math.random() * consensusMessages.length)];
}; 