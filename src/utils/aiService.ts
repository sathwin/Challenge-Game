import axios from 'axios';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
// Updated to use o3-mini model
const OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || 'o3-mini';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Enable in browser usage
});

/**
 * Get a response from the AI character
 */
export const getAIResponse = async (
  prompt: string, 
  character: 'guide' | 'opponent' | 'ally' = 'guide',
  previousMessages: Message[] = []
): Promise<string> => {
  try {
    // Create character personalities with more specific guidance
    let systemMessage = '';
    
    switch (character) {
      case 'guide':
        systemMessage = `You are Professor Beanington, a wise and helpful guide in the CHALLENGE Game about refugee education policy. 
        You are moderating a discussion between agents with different political views.
        Keep responses concise (2-3 sentences).
        Focus on guiding the discussion toward consensus while respecting different viewpoints.
        Occasionally use bean-related metaphors (like "sprouting ideas" or "cultivating solutions").
        Your goal is to help participants understand complex policy trade-offs in refugee education.`;
        break;
      case 'opponent':
        systemMessage = `You are a conservative politician participating in a discussion about refugee education policy.
        Express viewpoints that focus on:
        - Fiscal responsibility and budget constraints
        - Preserving traditional education methods
        - Integration of refugees into existing structures rather than creating special programs
        - Concerns about standards being maintained
        Keep your responses concise (2-3 sentences) and professional but firm in your conservative stance.
        Avoid being rude or dismissive, but show skepticism toward expensive or progressive approaches.`;
        break;
      case 'ally':
        systemMessage = `You are a progressive/socialist politician participating in a discussion about refugee education policy.
        Express viewpoints that focus on:
        - Inclusion, equity, and social justice
        - Supporting comprehensive programs for refugees
        - Investment in specialized services
        - Celebrating diversity and cultural exchange
        Keep your responses concise (2-3 sentences) and passionate but focused on policy.
        Occasionally use a made-up phrase to emphasize your cultural sensitivity (like "Mira sotela!" meaning "We must unite!").`;
        break;
      default:
        systemMessage = `You are a thoughtful participant in a policy discussion about refugee education.
        Keep your responses concise (2-3 sentences).
        Focus on the policy aspects rather than abstract philosophy.
        Be respectful of other viewpoints while clearly stating your own position.`;
    }

    // Add clear instructions for focused responses
    systemMessage += `\n\nIMPORTANT: 
    1. Keep your response under 3 sentences
    2. Stay in character at all times
    3. Do not reference being an AI
    4. Focus specifically on the policy discussion at hand
    5. Respond directly to what the user just said`;

    // Prepare the messages for the AI model
    const messageHistory = [
      { role: 'system' as const, content: systemMessage },
      ...previousMessages,
      { role: 'user' as const, content: prompt }
    ];

    try {
      console.log(`Sending request to OpenAI with model: ${OPENAI_MODEL}`);
      // Try using the new o3-mini model format
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: messageHistory,
        temperature: 0.7,
        max_tokens: 300
      });
      
      console.log('OpenAI o3-mini response received');
      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error with o3-mini format, falling back to chat completions:', error);
      
      // Fallback to the chat completions API
      const fallbackResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: messageHistory,
          temperature: 0.7,
          max_tokens: 300
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          }
        }
      );
      
      console.log('Fallback OpenAI chat response received:', fallbackResponse.status);
      return fallbackResponse.data.choices[0].message.content;
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API Error details:', error.response.data);
    }
    return "I'm having trouble connecting to my knowledge base. Let's continue with the game!";
  }
};

export const getGameReflection = async (
  userDecisions: Record<number, number>,
  policyCategories: any[]
): Promise<string> => {
  try {
    // Format the user's decisions for the AI
    let decisionsText = 'User selected the following policies:\n';
    
    policyCategories.forEach(category => {
      const selectedOptionId = userDecisions[category.id];
      if (selectedOptionId) {
        const option = category.options.find((opt: any) => opt.id === selectedOptionId);
        if (option) {
          decisionsText += `- ${category.name}: ${option.title} (Cost: ${option.cost})\n`;
        }
      }
    });

    const systemPrompt = `You are Professor Beanington, an expert in refugee education policy from the Republic of Bean.
    Analyze the player's policy choices and provide a thoughtful, educational reflection on their impact.
    Focus on how these choices might affect refugees, social cohesion, and the education system.
    Include both positive aspects and potential challenges of their approach.
    Keep your tone professional but friendly, and make references to the game's fictional setting.
    Limit your response to about 250 words and ensure it feels like an expert assessment rather than generic praise.`;

    // Prepare the messages for the model
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: decisionsText + "\n\nProvide a reflection on these policy choices and their potential impacts." }
    ];

    try {
      console.log(`Generating reflection with ${OPENAI_MODEL}`);
      // Try using the chat completions API with o3-mini model
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });
      
      console.log('Reflection generated successfully with o3-mini');
      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error with o3-mini format for reflection, falling back to direct API call:', error);
      
      // Fallback to direct API call
      console.log('Generating game reflection with fallback method...');
      const fallbackResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          }
        }
      );

      console.log('Reflection generated successfully with fallback');
      return fallbackResponse.data.choices[0].message.content;
    }
  } catch (error) {
    console.error('Error generating game reflection:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API Error details:', error.response.data);
    }
    return "Thank you for your participation in the CHALLENGE Game. Your policy choices reflect a unique approach to the refugee education challenge in the Republic of Bean. Continue reflecting on these complex issues in your real-world context.";
  }
}; 