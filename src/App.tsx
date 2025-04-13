import React from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { GameProvider, useGameContext } from './context/GameContext';
import IntroductionScreen from './components/IntroductionScreen';
import UserInfoForm from './components/UserInfoForm';
import Phase1 from './pages/Phase1';
import Phase2 from './pages/Phase2';
import Phase3 from './pages/Phase3';
import Report from './pages/Report';
import GameTheme from './styles/GameTheme';
import GameBackground from './components/GameBackground';

// Game content component
const GameContent: React.FC = () => {
  const { state } = useGameContext();
  
  // Determine which background variant to use based on game phase
  const getBackgroundVariant = () => {
    switch (state.phase) {
      case 'intro':
      case 'userInfo':
        return 'intro';
      case 'report':
        return 'report';
      default:
        return 'gameplay';
    }
  };
  
  // Render the appropriate component based on the current phase
  const renderGameComponent = () => {
    switch (state.phase) {
      case 'intro':
        return <IntroductionScreen />;
      case 'userInfo':
        return <UserInfoForm />;
      case 'phase1':
        return <Phase1 />;
      case 'phase2':
        return <Phase2 />;
      case 'phase3':
        return <Phase3 />;
      case 'report':
        return <Report />;
      default:
        return <IntroductionScreen />;
    }
  };

  return (
    <GameBackground variant={getBackgroundVariant()}>
      {renderGameComponent()}
    </GameBackground>
  );
};

function App() {
  return (
    <div className="app-container">
      <ThemeProvider theme={GameTheme}>
        <CssBaseline />
        <GameProvider>
          <GameContent />
        </GameProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
