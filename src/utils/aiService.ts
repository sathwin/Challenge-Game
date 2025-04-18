import axios from 'axios';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
// Use gpt-4.1-mini as fallback if o4-mini isn't available
const OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4.1-mini';

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
    // Extract the character name from the prompt if available
    const nameMatch = prompt.match(/You are ([^,]+),/);
    const characterName = nameMatch ? nameMatch[1].trim() : null;
    
    // Create character personalities with more specific guidance
    let systemMessage = '';
    
    if (characterName) {
      // If we have a specific character name, use that in the prompt
      systemMessage = `You are ${characterName}. You must respond as if you ARE ${characterName}, using "I" pronouns. 
      Never break character or pretend to be anyone else.
      Never respond as if you were Professor Beanington or any other character.
      Your response must be written in first-person perspective as ${characterName}.`;
      
      // Add character's political stance if mentioned in prompt
      if (prompt.includes('Conservative') || character === 'opponent') {
        systemMessage += `\nYou have conservative views on education policy, including:
        - Fiscal responsibility and careful spending
        - Preserving traditional educational methods and standards
        - Preference for integrating refugees into existing systems rather than creating expensive special programs
        - Occasionally mention practical fiscal concerns in your responses`;
      } else if (prompt.includes('Progressive') || prompt.includes('Socialist') || character === 'ally') {
        systemMessage += `\nYou have progressive/socialist views on education policy, including:
        - Strong belief in inclusion, equity, and social justice
        - Support for comprehensive programs for refugees
        - Celebration of diversity and cultural exchange
        - Occasionally reference social equity and justice in your responses`;
      } else if (prompt.includes('Moderate')) {
        systemMessage += `\nYou have moderate political views, believing in:
        - Finding balanced approaches to refugee education
        - Pragmatic solutions that respect tradition while embracing necessary changes
        - Compromise between fiscal responsibility and necessary support services
        - Often reference finding middle ground in your responses`;
      }
    } else {
      // Default characters if no specific name is provided
      switch (character) {
        case 'guide':
          systemMessage = `You are Professor Beanington, a wise and helpful guide in the CHALLENGE Game about refugee education policy. 
          You are moderating a discussion between agents with different political views.
          Keep responses concise (2-3 sentences).
          Focus on guiding the discussion toward consensus while respecting different viewpoints.
          Occasionally use bean-related metaphors (like "sprouting ideas" or "cultivating solutions").`;
          break;
        case 'opponent':
          systemMessage = `You are a conservative politician participating in a discussion about refugee education policy.
          You have a fiscal conservative viewpoint emphasizing:
          - Budget constraints and responsible spending
          - Preserving traditional education methods
          - Integration into existing structures rather than creating special programs
          - Concerns about maintaining educational standards
          Keep your responses concise (2-3 sentences) and professional.`;
          break;
        case 'ally':
          systemMessage = `You are a progressive/socialist politician participating in a discussion about refugee education policy.
          You advocate strongly for:
          - Inclusion, equity, and social justice
          - Comprehensive support programs for refugees
          - Investment in specialized services
          - Celebrating diversity and cultural exchange
          Keep your responses concise (2-3 sentences) and passionate about equity.`;
          break;
        default:
          systemMessage = `You are a moderate politician participating in a policy discussion about refugee education.
          You aim to balance:
          - Practical concerns about resources
          - The need for specialized support for refugees
          - Finding middle-ground solutions that most stakeholders can accept
          Keep your responses concise (2-3 sentences).`;
      }
    }

    // Add clear instructions for focused responses
    systemMessage += `\n\nCRITICAL INSTRUCTIONS: 
    1. Keep your response under 3 sentences
    2. DO NOT start with phrases like "As [name]" or "As a [role]"
    3. DO NOT reference being an AI or language model
    4. Stay in character throughout your entire response
    5. Focus ONLY on the policy discussion at hand
    6. Respond directly to what was just said
    7. Use natural, conversational language`;

    try {
      console.log(`Sending request to OpenAI for ${characterName || character}`);
      console.log(`Prompt: "${prompt.substring(0, 100)}..."`);
      
      // Create proper message format for OpenAI
      const messages = [
        { role: 'system' as const, content: systemMessage },
        ...previousMessages.map(msg => ({ 
          role: msg.role as 'system' | 'user' | 'assistant', 
          content: msg.content 
        })),
        { role: 'user' as const, content: prompt }
      ];

      // Use the chat completions API with gpt-4.1-mini as it's more stable
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: messages,
        temperature: 0.8,
        max_tokens: 300,
        presence_penalty: 0.2,
        frequency_penalty: 0.2
      });
      
      console.log('OpenAI response received');
      
      // Get response text
      let responseText = response.choices[0].message.content || '';
      
      // More comprehensive check for identity confusion patterns
      const identityConfusion = 
        /\b(?:as |I am |I'm |this is )(?:professor|prof\.|a professor|your guide|a guide)/i.test(responseText) ||
        /\bas\s+[\w\s]+(?:,|\.|\b)/i.test(responseText) || // Catches "As [any role/name],"
        /I\s+am\s+an\s+AI/i.test(responseText) ||
        /language\s+model/i.test(responseText);
      
      if (identityConfusion && characterName) {
        console.log("Identity confusion detected, fixing response");
        
        // Fix common identity confusion patterns
        responseText = responseText
          .replace(/(?:As|Speaking as|In my role as)[\w\s]+(?:,|\.|\b)/i, "") // Remove "As X," prefixes
          .replace(/(?:I am|I'm|This is)[\w\s]+?(?:,|\.|\b)/i, "") // Remove "I am X," prefixes
          .replace(/I am an AI/i, `I am ${characterName}`)
          .replace(/language model/i, "politician")
          .trim();
        
        // If the response still has identity issues or is now too short, generate a fallback
        if (identityConfusion || responseText.length < 20) {
          return `I think we should find a balanced approach that considers both educational quality and cultural integration needs.`;
        }
      }
      
      return responseText;
    } catch (error) {
      console.error('Error with OpenAI API, falling back to direct API call:', error);
      
      // Fallback to direct API call using standard chat completions API
      try {
        const messages = [
          { role: 'system' as const, content: systemMessage },
          ...previousMessages.map(msg => ({ 
            role: msg.role as 'system' | 'user' | 'assistant', 
            content: msg.content 
          })),
          { role: 'user' as const, content: prompt }
        ];
        
        const fallbackResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4.1-mini',
            messages: messages,
            temperature: 0.8,
            max_tokens: 300,
            presence_penalty: 0.2,
            frequency_penalty: 0.2
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
          }
        );
        
        console.log('Fallback OpenAI API call successful');
        let responseText = fallbackResponse.data.choices[0].message.content;
        
        // Apply the same identity confusion checks
        const identityConfusion = 
          /\b(?:as |I am |I'm |this is )(?:professor|prof\.|a professor|your guide|a guide)/i.test(responseText) ||
          /\bas\s+[\w\s]+(?:,|\.|\b)/i.test(responseText) ||
          /I\s+am\s+an\s+AI/i.test(responseText) ||
          /language\s+model/i.test(responseText);
        
        if (identityConfusion && characterName) {
          responseText = responseText
            .replace(/(?:As|Speaking as|In my role as)[\w\s]+(?:,|\.|\b)/i, "")
            .replace(/(?:I am|I'm|This is)[\w\s]+?(?:,|\.|\b)/i, "")
            .replace(/I am an AI/i, `I am ${characterName}`)
            .replace(/language model/i, "politician")
            .trim();
            
          if (responseText.length < 20) {
            return `I think we need to consider all perspectives on this important refugee education issue.`;
          }
        }
        
        return responseText;
      } catch (finalError) {
        console.error('All API attempts failed:', finalError);
        return characterName 
          ? `I think we should focus on practical solutions for refugee education that balance our resources with the needs of all students.`
          : "I believe we should carefully consider all perspectives on this important issue.";
      }
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API Error details:', error.response.data);
    }
    
    // Last-resort fallback
    const nameMatch = prompt.match(/You are ([^,]+),/);
    const characterName = nameMatch ? nameMatch[1].trim() : "a policy expert";
    
    return `I think we should focus on developing effective education policies that support refugee integration while respecting our community's values and resources.`;
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

    // Set up messages for the chat API
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: decisionsText + "\n\nProvide a reflection on these policy choices and their potential impacts." }
    ];

    try {
      console.log(`Generating reflection with ${OPENAI_MODEL}`);
      
      // Use the standard chat completions API with gpt-4.1-mini
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });
      
      console.log('Reflection generated successfully');
      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error with model, falling back to direct API call:', error);
      
      // Fallback to direct API call
      console.log('Generating game reflection with fallback method...');
      const fallbackResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4.1-mini',
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