export interface PolicyOption {
  id: number;
  title: string;
  description: string;
  advantages: string;
  disadvantages: string;
  cost: number;
}

export interface PolicyCategory {
  id: number;
  name: string;
  options: PolicyOption[];
  selectedOption?: number;
}

export interface Agent {
  id: number;
  name: string;
  age: number;
  occupation: string;
  education: string;
  socioeconomicStatus: string;
  politicalStance: string;
  policyChoices: Record<number, number>; // category id -> option id
  remainingBudget: number;
}

export interface User {
  age?: string;
  nationality?: string;
  occupation?: string;
  education?: string;
  displacementExperience?: string;
  location?: string;
  policyChoices: Record<number, number>; // category id -> option id
  remainingBudget: number;
}

export interface GameState {
  phase: 'intro' | 'userInfo' | 'phase1' | 'phase2' | 'phase3' | 'report';
  user: User;
  agents: Agent[];
  policyCategories: PolicyCategory[];
  groupDecisions: Record<number, number>; // category id -> option id
  reflectionAnswers: Record<string, string>;
}

export interface ReflectionQuestion {
  id: string;
  question: string;
} 