# CHALLENGE Game - Refugee Education Policy Simulation

CHALLENGE (Creating Holistic Approaches for Learning, Liberty, and Equity in New Global Education) is an interactive simulation game focused on refugee education policymaking. This web application allows users to engage with the complexities of education policy for refugee populations under budget constraints, promoting critical reflection on justice and inclusion.

![CHALLENGE Game](https://github.com/sathwin/Challenge-Game/raw/main/public/pixel-professor.png)

## 🌟 Overview

The game is played in three phases with one real participant and three AI-generated agents with distinct political perspectives:

1. **Phase I: Scenario Reading & Individual Decision-Making**
   - Players read about the fictional Republic of Bean
   - Each player selects policy options across seven categories without exceeding 14 budget units
   - Policies include Access to Education, Language Instruction, Teacher Training, and more

2. **Phase II: Group Discussion & Consensus-Building**
   - The real participant debates with three AI agents representing different ideological stances:
     - Dr. Sarah Chen (Progressive)
     - Thomas Reynolds (Conservative)
     - Maria González (Socialist)
   - Decisions are made through majority voting
   - The final policy package must stay within the 14-unit budget

3. **Phase III: Reflection & Debrief**
   - The participant answers guided reflection questions on their experience
   - The system generates an evaluation report based on choices and reflections

## ⚙️ Installation & Setup

To run the CHALLENGE Game locally:

```bash
# Clone the repository
git clone https://github.com/sathwin/Challenge-Game.git

# Navigate to the project folder
cd Challenge-Game

# Install dependencies
npm install

# Start the development server
npm start
```

The application will open in your browser at `http://localhost:3000`.

## 🎮 Game Features

- **Realistic Policy Simulation**: 7 policy categories with 3 options each, representing real-world tradeoffs
- **Dynamic Budget System**: Real-time tracking of budget allocation with visual feedback
- **AI Agents**: Three agents with distinct political and ideological stances that respond intelligently to user input
- **Interactive Dialogue**: Text-based interaction with AI agents that maintains character consistency
- **Voting System**: Majority-based group decision mechanism that simulates real committee processes
- **Reflection Module**: Guided questions to promote critical thinking about policy decisions
- **Evaluation Report**: Final analysis of policy choices and justice considerations, including a quality score

## 🛠️ Technologies Used

- **Frontend**: React 19 with TypeScript
- **UI Framework**: Material UI 7
- **State Management**: React Context API
- **Animation**: Framer Motion
- **Styling**: Emotion
- **Notifications**: Notistack
- **Routing**: React Router Dom 7
- **Text Effects**: React Typed/Typewriter Effect
- **Deployment**: Ready for deployment on Vercel or similar platforms

## 📱 Key Components

- **GameContext**: Central state management for the entire application
- **Phase1**: Individual policy selection interface
- **Phase2**: Discussion interface with AI agents
- **Phase3**: Reflection questionnaire
- **Report**: Final evaluation and scoring system
- **AgentMessage**: Renders agent interactions with appropriate styling
- **PolicySelectionCard**: Interface for policy option selection

## 📋 Educational Context

This simulation is designed for educational purposes, particularly in:
- Teacher education programs
- Policy studies courses
- Refugee and migration studies
- Educational leadership training

The goal is to promote justice-oriented thinking about refugee education and create awareness about the complex interplay of politics, resources, and ethics in educational policymaking.

## 📝 Note on Email Functionality

The application includes a simulated email reporting feature that:
- Does not actually send real emails
- Shows success notifications for demonstration purposes
- Logs email content to the browser console for verification
- Automatically "sends" a copy of the report to aturan@asu.edu (simulation only)

## 🔮 Future Enhancements

- Integration with a real email API for actual report delivery
- Integration with speech-to-text API for more natural voice interaction
- More sophisticated AI agent responses based on OpenAI or similar technologies
- Enhanced visualization of policy impacts
- Mobile-responsive design improvements
- Additional agent personalities and viewpoints

## 🔧 Troubleshooting

- If you encounter notification system issues, try updating the notistack version
- For type errors, ensure @types/react and @types/react-dom are properly installed
- Browser console logs provide detailed information about simulated email sending

## 👥 Credits

Developed as part of the AI CHALLENGE Hackathon, inspired by research on refugee education policy and critical pedagogy.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
