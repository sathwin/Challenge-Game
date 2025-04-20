import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GameProvider, useGameContext } from './context/GameContext';
import { BrowserRouter as Router } from 'react-router-dom';
import IntroductionScreen from './components/IntroductionScreen';
import UserInfoForm from './components/UserInfoForm';
import Phase1 from './pages/Phase1';
import Phase2 from './pages/Phase2';
import Phase3 from './pages/Phase3';
import Report from './pages/Report';
import GameTheme from './styles/GameTheme';
import GameBackground from './components/GameBackground';
import { SnackbarProvider as NotistackProvider } from 'notistack';

// Create a theme instance
const theme = createTheme({
  // ... existing code ...
});

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
      <Router>
        <ThemeProvider theme={GameTheme}>
          <CssBaseline />
          <GameProvider>
            <NotistackProvider 
              maxSnack={3} 
              autoHideDuration={3000}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
            >
              <GameContent />
            </NotistackProvider>
          </GameProvider>
        </ThemeProvider>
      </Router>
    </div>
  );
}

export default App;
