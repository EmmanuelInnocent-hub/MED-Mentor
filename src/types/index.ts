export interface Case {
  id: string;
  title: string;
  specialty: string;
  difficulty: "Intern" | "Resident" | "Attending";
  patientBrief: string;
  correctDiagnosis: string;
  keySteps: string[];
  commonMistakes: string[];
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ScoreDimensions {
  diagnosticAccuracy: number;
  reasoningProcess: number;
  keyStepCoverage: number;
  safetyAwareness: number;
}

export interface SessionResult {
  id: string;
  caseId: string;
  caseTitle: string;
  specialty: string;
  messages: Message[];
  score: {
    overall: number;
    dimensions: ScoreDimensions;
    strengths: string[];
    gaps: string[];
    feedback: string;
    grade: string;
  };
  completedAt: string;
}
