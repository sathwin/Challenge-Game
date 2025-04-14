import axios from 'axios';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
// Fallback to gpt-4o-mini which is proven to work
const OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
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
    // Create character personalities
    let systemMessage = '';
    
    switch (character) {
      case 'guide':
        systemMessage = `You are Professor Beanington, a wise and helpful guide in the CHALLENGE Game. 
        You speak in a friendly but authoritative tone, using academic language occasionally. 
        Your goal is to help the player understand the game mechanics and make informed decisions.
        Occasionally use bean-related puns or metaphors to lighten the mood.
        Keep your responses concise and helpful, focusing on guiding the player.`;
        break;
      case 'opponent':
        systemMessage = `You are Minister Grapeson, a conservative politician from the majority Grapes group.
        You speak in a formal, sometimes condescending tone.
        You believe in preserving the traditional values and maintaining the status quo.
        You are skeptical about changes that might threaten the Grapes' dominance.
        Keep your responses concise but show your character's perspective.`;
        break;
      case 'ally':
        systemMessage = `You are Councilor Curlyhair, an advocate for the Curly Hairs minority group.
        You speak passionately about inclusion, diversity, and equal rights.
        You are supportive of progressive policies that help minorities and refugees.
        Use occasional phrases in your native language (just make these up) to emphasize your cultural identity.
        Keep your responses concise but show your unique perspective.`;
        break;
      default:
        systemMessage = `You are a helpful game character in the CHALLENGE Game.`;
    }

    // For simplicity and reliability, let's use the Chat Completions API which is more stable
    const messages: Message[] = [
      { role: 'system', content: systemMessage },
      ...previousMessages,
      { role: 'user', content: prompt }
    ];

    // Call OpenAI API using chat completions endpoint
    console.log(`Sending request to OpenAI with model: ${OPENAI_MODEL}`);
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages,
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

    console.log('OpenAI response received:', response.status);
    return response.data.choices[0].message.content;
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

    // Use chat completions API as it's more stable
    console.log('Generating game reflection...');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: decisionsText + "\n\nProvide a reflection on these policy choices and their potential impacts." }
        ],
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

    console.log('Reflection generated successfully');
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating game reflection:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API Error details:', error.response.data);
    }
    return "Thank you for your participation in the CHALLENGE Game. Your policy choices reflect a unique approach to the refugee education challenge in the Republic of Bean. Continue reflecting on these complex issues in your real-world context.";
  }
}; 