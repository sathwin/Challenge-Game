import React from 'react';
import { Box } from '@mui/material';

interface GameBackgroundProps {
  children: React.ReactNode;
  variant?: 'intro' | 'gameplay' | 'report';
}

const GameBackground: React.FC<GameBackgroundProps> = ({ 
  children, 
  variant = 'gameplay' 
}) => {
  
  // Different background styles based on variant
  const getBackgroundStyles = () => {
    switch (variant) {
      case 'intro':
        return {
          background: `
            linear-gradient(0deg, rgba(14, 14, 30, 0.95), rgba(25, 25, 50, 0.9)),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 221, 255, 0.05) 2px, rgba(139, 221, 255, 0.05) 4px)
          `,
          boxShadow: 'inset 0 0 50px rgba(139, 221, 255, 0.2)',
        };
      case 'report':
        return {
          background: `
            linear-gradient(0deg, rgba(20, 30, 20, 0.95), rgba(30, 50, 30, 0.9)),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(100, 255, 100, 0.05) 2px, rgba(100, 255, 100, 0.05) 4px)
          `,
          boxShadow: 'inset 0 0 50px rgba(100, 255, 100, 0.2)',
        };
      case 'gameplay':
      default:
        return {
          background: `
            linear-gradient(0deg, rgba(30, 20, 30, 0.95), rgba(50, 30, 50, 0.9)),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 92, 180, 0.05) 2px, rgba(255, 92, 180, 0.05) 4px)
          `,
          boxShadow: 'inset 0 0 50px rgba(255, 92, 180, 0.2)',
        };
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflowX: 'hidden',
        ...getBackgroundStyles(),
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAHASURBVGhD7Zk9TsNAEIUdkVNQcAMKJI7BDag4ARUn4ASUFEicgBNQU9DSItHSUeFIUCAh8T8+7awVee3EMSuzG+VJI8Xe9TD7PBvb2tlkMunJH+E/QTY3FJg5YfGNEfJKWHxjhLwRFt8YIa+ExTdGyCNh8Y0RcktYfGOEXBMW3xgho/Q8QdSGlVKEuUtQmjC/EJbWGCFnhKU1RsgJYWmNEXJEWFpjhBwQltYYIfuEpTVGyC5haY0RskNYWmOEbBOW1hghW4SlNUbIJmFpjRGyRlhaY4SsEpbWaH8jSTRl5XQymfTyvtoYIQy2+DM9yPdFwmKPEcJQ/+PYpIhKhMUeI4ShDoajiWKqEBZ7jBCGOR4+Jk+miLDYY4QwTIYrUkxovpBLwuIXI4Qh3g8f9FTaA+nK5b2zNHWNXYQ0ULl1Mh3Q1DU0G1oa5mpotbBQoUKGrEJVcfWEBYl0g8v84SMsPrCfWr5phLwTFt8YIS+ExTdGCOXVNcI3Rsgt91JYfGOEXBEW3xghI8LiGyPknLD4xgg5JSy+MUKOCYtvjJDKa5VrjJDKe+hrJP6m58YIOSQsvjFCDgiLb4yQfcLim0UXovvzC20+7+M6ESgnAAAAAElFTkSuQmCC")',
          backgroundRepeat: 'repeat',
          opacity: 0.1,
          pointerEvents: 'none',
          zIndex: 2,
        },
      }}
    >
      {/* Scanlines effect */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.05) 50%)',
          backgroundSize: '100% 4px',
          pointerEvents: 'none',
          zIndex: 40,
          opacity: 0.2,
        }}
      />

      {/* Content container */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>

      {/* Visual elements - decorative pixels */}
      {variant === 'intro' && (
        <>
          <Box
            sx={{
              position: 'fixed',
              top: '10%',
              left: '5%',
              width: '8px',
              height: '8px',
              backgroundColor: 'primary.light',
              boxShadow: '0 0 8px rgba(139, 221, 255, 0.8)',
              animation: 'pulse 4s infinite',
              zIndex: 5,
            }}
          />
          <Box
            sx={{
              position: 'fixed',
              bottom: '15%',
              right: '8%',
              width: '12px',
              height: '12px',
              backgroundColor: 'secondary.main',
              boxShadow: '0 0 10px rgba(255, 92, 180, 0.8)',
              animation: 'pulse 6s infinite',
              zIndex: 5,
            }}
          />
        </>
      )}

      {/* Add more pixel decorations based on variant */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
          }
        `}
      </style>
    </Box>
  );
};

export default GameBackground; 