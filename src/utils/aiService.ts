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

    // Prepare the messages for the AI model
    const messageHistory = [
      { role: 'system' as const, content: systemMessage },
      ...previousMessages,
      { role: 'user' as const, content: prompt }
    ];

    try {
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