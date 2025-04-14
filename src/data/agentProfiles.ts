import { Agent } from '../types';

export const agentProfiles: Agent[] = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    age: 52,
    occupation: "Professor of Education Policy",
    education: "Ph.D. in Education Policy",
    socioeconomicStatus: "Upper-middle class",
    politicalStance: "Progressive",
    bio: "An advocate for inclusive educational policies with extensive research in refugee education programs.",
    policyChoices: {
      1: 3, // Comprehensive Integration
      2: 3, // Cultural Exchange Programs
      3: 2, // Specialized Trauma Support
      4: 3, // Refugee-Led Initiatives
      5: 3  // Digital Learning Platforms
    },
    isAlly: true,
    avatar: "/avatars/sarah-chen.png",
    remainingBudget: 14
  },
  {
    id: 2,
    name: "Thomas Reynolds",
    age: 59,
    occupation: "Business Leader",
    education: "MBA from Harvard Business School",
    socioeconomicStatus: "Upper class",
    politicalStance: "Conservative",
    bio: "A fiscal conservative who believes in responsible spending and traditional education approaches.",
    policyChoices: {
      1: 1, // Separate Classes
      2: 1, // Basic Language Support
      3: 1, // Standard Counseling
      4: 1, // Teacher Training
      5: 1  // Traditional Materials
    },
    isAlly: false,
    avatar: "/avatars/thomas-reynolds.png",
    remainingBudget: 14
  },
  {
    id: 3,
    name: "Maria González",
    age: 45,
    occupation: "Community Organizer",
    education: "Master's in Social Work",
    socioeconomicStatus: "Middle class",
    politicalStance: "Socialist",
    bio: "A passionate advocate for social justice who believes in equal opportunities for all children.",
    policyChoices: {
      1: 3, // Comprehensive Integration
      2: 3, // Cultural Exchange Programs
      3: 3, // Community Mental Health Partnerships
      4: 2, // Parent Engagement
      5: 2  // Multilingual Resources
    },
    isAlly: true,
    avatar: "/avatars/maria-gonzalez.png",
    remainingBudget: 14
  }
];

export default agentProfiles; 