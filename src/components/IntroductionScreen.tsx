import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useGameContext } from '../context/GameContext';
import GameCharacter from './GameCharacter';
import { motion } from 'framer-motion';
import { getAIResponse } from '../utils/aiService';

const IntroductionScreen: React.FC = () => {
  const { dispatch } = useGameContext();
  const [introMessage, setIntroMessage] = useState<string>("");
  const [showRules, setShowRules] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const fetchIntroduction = async () => {
      try {
        const message = await getAIResponse(
          "Welcome the player to the CHALLENGE Game. Explain briefly that you're Professor Beanington and you'll be their guide. Be enthusiastic but keep it under 3 sentences.",
          'guide'
        );
        setIntroMessage(message);
      } catch (error) {
        setIntroMessage("Welcome to the CHALLENGE Game! I'm Professor Beanington, and I'll be your guide through this exciting educational journey. Let's get started!");
      }
    };

    fetchIntroduction();
  }, []);

  const handleStartGame = () => {
    dispatch({ type: 'SET_PHASE', payload: 'userInfo' });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Paper elevation={6} sx={{ p: 0, overflow: 'hidden', mb: 4 }}>
          <Box sx={{ 
            p: 3, 
            backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9))',
            borderBottom: '2px solid',
            borderColor: 'primary.main'
          }}>
            <Typography 
              variant="h3" 
              align="center" 
              gutterBottom 
              color="primary"
              sx={{ 
                textShadow: '0 0 10px rgba(139, 221, 255, 0.7)',
                letterSpacing: '0.1em'
              }}
            >
              CHALLENGE GAME
            </Typography>
            
            <Typography 
              variant="h5" 
              align="center" 
              gutterBottom 
              sx={{ 
                mb: 2,
                textShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
                color: 'text.secondary',
                fontWeight: 300
              }}
            >
              Creating Holistic Approaches for Learning, Liberty, and Equity in New Global Education
            </Typography>
          </Box>

          {introMessage && (
            <GameCharacter 
              message={introMessage}
              onMessageComplete={() => setIsReady(true)}
            />
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isReady ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper 
              elevation={3} 
              sx={{ 
                mx: 3, 
                mb: 3, 
                p: 3,
                border: '1px solid',
                borderColor: 'secondary.main',
                bgcolor: 'rgba(0,0,0,0.4)'
              }}
            >
              <Typography variant="h4" align="center" gutterBottom sx={{ color: 'secondary.main' }}>
                Republic of Bean
              </Typography>

              <Box sx={{ mx: 'auto', maxWidth: '800px', lineHeight: 1.6, my: 2 }}>
                <Typography paragraph>
                  You are an honorable member of parliament in the Republic of Bean, a unique nation situated in a distant realm beyond Earth. While the country is not wealthy, its citizens enjoy free access to education, healthcare, and various public services. The Republic of Bean prides itself on its multicultural society, comprising three ethnicities and two religious minority groups. Thanks to the country's commitment to secularism, citizens are free to practice their religions without any obstacles. However, due to safety concerns, the nation follows many monolithic praxis and policies, which includes a monolingual education system and teaching only Grapes', the majority group, history, and literature. Also, Grapes' language, Teanish is the only official language is used for the public services.
                </Typography>
                
                <Typography paragraph>
                  The largest minority group in the Republic of Bean is the Curly Hairs, who possess distinct ethnic backgrounds and their own language. They have long been advocating for their cultural rights, with a specific focus on education in their mother tongue. The Curly Hairs make up approximately 22% of the country's total population.
                </Typography>
                
                <Typography paragraph>
                  While poverty is not a prevalent issue in the Republic of Bean, the nation suffer from corruption, which angers citizens. In response, citizens occasionally take to the streets in protest, sometimes resulting in clashes with the police. Additionally, Grapes seeks to maintain their dominance in the administration and bureaucracy. They hold the belief that sharing power with other groups would jeopardize the nation's future.
                </Typography>
                
                <Typography paragraph>
                  The Republic of Bean shares borders with four neighboring countries, three of which enjoy stable conditions. However, the country's northwestern neighbor, Orangenya, is currently experiencing internal conflicts. As a result, two million individuals have sought refuge in the Republic of Bean, comprising 14% of its entire population. Despite their geographic proximity, these refugees and the citizens of the Republic of Bean possess numerous cultural differences.
                </Typography>
                
                <Typography paragraph>
                  In the aftermath of a global economic crisis, the Republic of Bean's economy has become increasingly unstable. Moreover, other nations worldwide are hesitant to extend solidarity towards the country. This unfortunately promotes xenophobia and political debates, leading to heightened polarization within the nation. In response to these challenges, the parliament has initiated an educational reform aimed at providing contemporary, quality, and accessible education for all refugees. Also, the parliament wants to focus on the social integration of refugees to prevent possible conflicts.
                </Typography>
                
                <Typography paragraph>
                  As a member of parliament, you bear the responsibility of actively participating in and contributing to this reform process. The reform package comprises 7 key factors, and you will be tasked with choosing an option from each factor, ensuring the allocation of limited resources. By making these decisions, you can help shape the future of refugee education in the Republic of Bean.
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={() => setShowRules(true)}
                  disabled={showRules}
                  sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
                >
                  Show Game Rules
                </Button>
              </Box>
            </Paper>
          </motion.div>

          {showRules && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper 
                elevation={3} 
                sx={{ 
                  mx: 3, 
                  mb: 3, 
                  p: 3,
                  border: '1px solid',
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(0,0,0,0.4)'
                }}
              >
                <Typography variant="h4" align="center" gutterBottom sx={{ color: 'primary.main' }}>
                  Rules
                </Typography>

                <Box sx={{ mx: 'auto', maxWidth: '800px', lineHeight: 1.6, my: 2 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: 'primary.light' }}>1. Budget Limit</Typography>
                    <Typography paragraph>
                      Your team has a total budget of 14 units to allocate across all policy decisions.
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: 'primary.light' }}>2. Option Costs</Typography>
                    <Typography paragraph>
                      Each policy option has a specific cost:
                      <br />- Option 1 costs 1 unit
                      <br />- Option 2 costs 2 units
                      <br />- Option 3 costs 3 units
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: 'primary.light' }}>3. Budget Management</Typography>
                    <Typography paragraph>
                      You must ensure that the total cost of your chosen policies does not exceed the 14-unit budget.
                      Balance the costs of each decision while addressing the needs of the refugees and the nation.
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: 'primary.light' }}>4. Policy Selection Variety</Typography>
                    <Typography paragraph>
                      You cannot select all your policies from just one option across the seven policy areas. For example, you cannot choose only Option 1 or only Option 2 for all seven policy decisions. Ensure a mix of options to encourage balanced decision-making.
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: 'primary.light' }}>5. Strategic Decision–Making</Typography>
                    <Typography paragraph>
                      Consider the advantages and disadvantages of each policy option. Your goal is to create an effective and inclusive refugee education package within the budget constraints.
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    onClick={handleStartGame}
                    sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                  >
                    Start Game
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
};

export default IntroductionScreen; 