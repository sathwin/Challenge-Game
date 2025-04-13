import { createTheme } from '@mui/material/styles';

// Defining a retro game theme with pixel-inspired design
const GameTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8bddff', // Bright blue - reminiscent of old arcade games
      light: '#b0e8ff',
      dark: '#5caacc',
      contrastText: '#000000',
    },
    secondary: {
      main: '#ff5cb4', // Neon pink - common in retro games
      light: '#ff8cd0',
      dark: '#b92d7c',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: 'rgba(30, 30, 40, 0.9)',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0e8ff',
    },
    error: {
      main: '#ff5252',
    },
    warning: {
      main: '#ffb74d',
    },
    info: {
      main: '#64b5f6',
    },
    success: {
      main: '#81c784',
    },
  },
  typography: {
    fontFamily: '"Press Start 2P", "Roboto Mono", monospace',
    h1: {
      fontFamily: '"Press Start 2P", "Roboto Mono", monospace',
      fontSize: '2.5rem',
      letterSpacing: '0.1em',
    },
    h2: {
      fontFamily: '"Press Start 2P", "Roboto Mono", monospace',
      fontSize: '2rem',
      letterSpacing: '0.1em',
    },
    h3: {
      fontFamily: '"Press Start 2P", "Roboto Mono", monospace',
      fontSize: '1.75rem', 
      letterSpacing: '0.1em',
    },
    h4: {
      fontFamily: '"Press Start 2P", "Roboto Mono", monospace',
      fontSize: '1.5rem',
      letterSpacing: '0.05em',
    },
    h5: {
      fontFamily: '"Press Start 2P", "Roboto Mono", monospace',
      fontSize: '1.25rem',
      letterSpacing: '0.05em',
    },
    h6: {
      fontFamily: '"Press Start 2P", "Roboto Mono", monospace',
      fontSize: '1rem',
      letterSpacing: '0.05em',
    },
    body1: {
      fontFamily: '"Roboto Mono", monospace',
      fontSize: '1rem',
      letterSpacing: '0.03em',
      lineHeight: 1.7,
    },
    body2: {
      fontFamily: '"Roboto Mono", monospace',
      fontSize: '0.875rem',
      letterSpacing: '0.03em',
    },
    button: {
      fontFamily: '"Press Start 2P", "Roboto Mono", monospace',
      fontSize: '0.875rem',
      letterSpacing: '0.05em',
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.8)',
          padding: '10px 20px',
          position: 'relative',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            pointerEvents: 'none',
          },
          '&:hover': {
            transform: 'translate(1px, 1px)',
            boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
          },
          '&:active': {
            transform: 'translate(3px, 3px)',
            boxShadow: '0px 0px 0px rgba(0, 0, 0, 0.8)',
          },
        },
        contained: {
          background: 'linear-gradient(to bottom, #b0e8ff 0%, #5caacc 100%)',
          color: '#000000',
          '&:hover': {
            background: 'linear-gradient(to bottom, #b0e8ff 0%, #8bddff 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundImage: 'linear-gradient(rgba(30, 30, 40, 0.9), rgba(20, 20, 30, 0.95))',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: '#8bddff',
          boxShadow: '0 0 10px rgba(139, 221, 255, 0.5), inset 0 0 15px rgba(0, 0, 0, 0.5)',
          padding: '20px',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          position: 'relative',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'linear-gradient(45deg, #121212 25%, #1a1a1a 25%, #1a1a1a 50%, #121212 50%, #121212 75%, #1a1a1a 75%, #1a1a1a 100%)',
          backgroundSize: '4px 4px',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(rgba(139, 221, 255, 0.1), rgba(255, 92, 180, 0.1))',
            pointerEvents: 'none',
            zIndex: 100,
          },
        },
      },
    },
  },
});

export default GameTheme; 