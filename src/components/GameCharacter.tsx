import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import Typewriter from 'typewriter-effect';

interface GameCharacterProps {
  message: string;
  name?: string;
  isTyping?: boolean;
  avatarSrc?: string;
  role?: 'guide' | 'opponent' | 'ally';
  onMessageComplete?: () => void;
}

// SVG pixel professor avatar component
const PixelProfessorAvatar: React.FC<{ role: string }> = ({ role }) => {
  const theme = useTheme();
  const color = role === 'guide' 
    ? theme.palette.primary.main 
    : role === 'opponent' 
      ? theme.palette.error.main 
      : theme.palette.success.main;

  return (
    <svg width="80" height="80" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" fill="#2D2D3A" />
      {/* Hair */}
      <rect x="3" y="2" width="10" height="3" fill="gray" />
      <rect x="2" y="3" width="1" height="2" fill="gray" />
      <rect x="13" y="3" width="1" height="2" fill="gray" />
      {/* Face */}
      <rect x="4" y="5" width="8" height="5" fill="#F5D0A9" />
      {/* Glasses */}
      <rect x="4" y="6" width="3" height="2" fill={color} stroke="#000" strokeWidth="0.5" />
      <rect x="9" y="6" width="3" height="2" fill={color} stroke="#000" strokeWidth="0.5" />
      <rect x="7" y="7" width="2" height="1" fill={color} stroke="#000" strokeWidth="0.5" />
      {/* Eyes */}
      <rect x="5" y="7" width="1" height="1" fill="#000" />
      <rect x="10" y="7" width="1" height="1" fill="#000" />
      {/* Mouth */}
      <rect x="6" y="9" width="4" height="1" fill="#A04040" />
      {/* Lab Coat/Body */}
      <rect x="4" y="10" width="8" height="6" fill="white" />
      <rect x="3" y="10" width="1" height="4" fill="white" />
      <rect x="12" y="10" width="1" height="4" fill="white" />
      {/* Bowtie */}
      <rect x="7" y="10" width="2" height="1" fill={color} />
    </svg>
  );
};

const GameCharacter: React.FC<GameCharacterProps> = ({
  message,
  name = 'Prof. Beanington',
  isTyping = true,
  avatarSrc,
  role = 'guide',
  onMessageComplete
}) => {
  const theme = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  // Set color based on role
  const getRoleColor = () => {
    switch (role) {
      case 'guide':
        return theme.palette.primary.main;
      case 'opponent':
        return theme.palette.error.main;
      case 'ally':
        return theme.palette.success.main;
      default:
        return theme.palette.primary.main;
    }
  };

  // Animation for the avatar
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Paper
      elevation={6}
      sx={{
        mb: 3,
        p: 0,
        overflow: 'hidden',
        borderColor: getRoleColor(),
        position: 'relative'
      }}
    >
      {/* Scanline effect */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 5,
          pointerEvents: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)',
            backgroundSize: '4px 4px',
            opacity: 0.15,
          }
        }}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'flex-start',
          p: 3,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Character avatar */}
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mr: { xs: 0, sm: 3 },
            mb: { xs: 2, sm: 0 },
            position: 'relative',
          }}
        >
          <motion.div
            animate={{
              y: isAnimating ? [0, -5, 0] : 0,
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                border: `3px solid ${getRoleColor()}`,
                boxShadow: `0 0 15px ${getRoleColor()}`,
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#2D2D3A',
              }}
            >
              <PixelProfessorAvatar role={role} />
            </Box>
          </motion.div>
          <Typography 
            variant="h6" 
            sx={{ 
              mt: 1, 
              fontSize: '0.9rem', 
              color: getRoleColor(),
              textShadow: `0 0 5px ${getRoleColor()}`
            }}
          >
            {name}
          </Typography>
        </Box>

        {/* Message content */}
        <Box 
          sx={{ 
            flexGrow: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            p: 2,
            border: `1px solid ${getRoleColor()}`,
            borderRadius: '4px',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: `radial-gradient(ellipse at center, ${getRoleColor()}10 0%, rgba(0, 0, 0, 0) 70%)`,
              pointerEvents: 'none',
            }
          }}
        >
          {isTyping ? (
            <Box 
              sx={{ 
                fontFamily: '"Roboto Mono", monospace',
                color: theme.palette.text.primary,
                fontWeight: 400,
                fontSize: '1rem',
                lineHeight: 1.6
              }}
            >
              <Typewriter
                onInit={(typewriter) => {
                  typewriter
                    .typeString(message)
                    .callFunction(() => {
                      if (onMessageComplete) onMessageComplete();
                    })
                    .start();
                }}
                options={{
                  delay: 30,
                  cursor: '_',
                  wrapperClassName: 'typewriter-wrapper',
                  cursorClassName: 'typewriter-cursor',
                }}
              />
            </Box>
          ) : (
            <Typography
              variant="body1"
              sx={{
                fontFamily: '"Roboto Mono", monospace',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6
              }}
            >
              {message}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default GameCharacter; 