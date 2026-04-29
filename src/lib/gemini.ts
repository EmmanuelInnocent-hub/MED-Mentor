import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Case, Message } from "../types";

// Standard initialization for Vite environment in AI Studio
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
      console.warn("GEMINI_API_KEY not found. AI features will be disabled.");
      // We still initialize to avoid null checks everywhere, but calls will fail
      aiClient = new GoogleGenAI({ apiKey: "MISSING_KEY" });
    } else {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

const MODEL_NAME = "gemini-flash-latest"; // Using the stable latest alias
const SCORING_MODEL = "gemini-3.1-pro-preview"; // Using Pro for complex reasoning scoring

export function buildSystemPrompt(caseData: Case, difficulty: string) {
  return `
You are MedMentor, a Socratic clinical reasoning tutor.
You are running a medical case simulation.

PATIENT CASE:
${caseData.patientBrief}

YOUR ROLE:
- Never reveal the diagnosis directly.
- Ask ONE focused question at a time.
- Use Socratic method: guide the student to discover the diagnosis.
- If they miss a life-threatening possibility, ask: "What are the 'must-not-miss' differentials here?"
- Respect the student's input but maintain clinical realism.
- Required steps for this case: ${caseData.keySteps.join(", ")}

DIFFICULTY: ${difficulty}.
TONE: Clinical, professional, encouraging but rigorous.
`.trim();
}

export async function getChatResponse(messages: Message[]) {
  // Map our messages to Gemini format, excluding the system prompt for the 'contents' array
  const chatContents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  // IMPORTANT: Gemini history must start with a 'user' message.
  // If the first message is assistant (model), we skip it in the API call.
  let apiContents = [...chatContents];
  while (apiContents.length > 0 && apiContents[0].role === 'model') {
    apiContents.shift();
  }

  // If no user message has been sent yet, we return a fallback response
  if (apiContents.length === 0) {
    return "I have received the clinical report. What are your first thoughts on our approach?";
  }

  const response = await getAiClient().models.generateContent({
    model: MODEL_NAME,
    contents: apiContents,
    config: {
      systemInstruction: systemPromptContent(messages),
      temperature: 0.7,
      // Safety settings - set to BLOCK_NONE to prevent clinical content from being blocked
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
      ]
    },
  });

  return response.text || "Clinical processing error. Could you rephrase your last request?";
}

export async function getModuleResponse(moduleName: string, messages: Message[]) {
  const moduleSystemPrompt = `
You are a senior medical consultant and Socratic tutor specializing in ${moduleName}.
Your goal is to guide the student through a clinical scenario in the ${moduleName} module.

STUDENT'S GOAL:
- Perform a systematic assessment.
- Identify key clinical findings.
- Propose a diagnostic and management plan.

YOUR ROLE:
- Be a Socratic mentor: Do not give answers. Ask guiding questions.
- If the student makes a clinical error, challenge their reasoning politely.
- Use a professional, encouraging, but rigorous academic tone.
- Integrate relevant ${moduleName} principles into your feedback.
- If they ask for help, provide a hint or a clinical pearl rather than the full answer.

SCENARIO CONTEXT: The student is currently interacting with a specific clinical case in your department.
`.trim();

  const chatContents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  let apiContents = [...chatContents];
  while (apiContents.length > 0 && apiContents[0].role === 'model') {
    apiContents.shift();
  }

  if (apiContents.length === 0) {
    return `Welcome to the ${moduleName} rotation. I see our patient is ready for assessment. How would you like to begin?`;
  }

  const response = await getAiClient().models.generateContent({
    model: MODEL_NAME,
    contents: apiContents,
    config: {
      systemInstruction: moduleSystemPrompt,
      temperature: 0.7,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
      ]
    },
  });

  return response.text || "I'm having trouble processing that clinical thought. Let's try reflecting on the primary symptoms again.";
}

export async function checkDrugInteraction(drugs: string[]) {
  const prompt = `
Analyze potential drug-drug interactions between: ${drugs.join(", ")}.
Provide a structured medical report.

Output format should be JSON:
{
  "severity": "Low" | "Moderate" | "Major" | "Contraindicated",
  "mechanism": "string explaining how they interact",
  "clinicalSignificance": "string explaining why this matters",
  "recommendation": "string recommending action",
  "references": ["string"]
}
`;

  const response = await getAiClient().models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, enum: ["Low", "Moderate", "Major", "Contraindicated"] },
          mechanism: { type: Type.STRING },
          clinicalSignificance: { type: Type.STRING },
          recommendation: { type: Type.STRING },
          references: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["severity", "mechanism", "clinicalSignificance", "recommendation"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { error: "Failed to analyze interactions" };
  }
}

function systemPromptContent(messages: Message[]): string {
  const system = messages.find(m => m.role === 'system');
  return system?.content || "You are a professional medical tutor.";
}

export async function scoreSession(messages: Message[], caseData: Case) {
  const scoringPrompt = `
Evaluate this medical student's reasoning.

CASE: ${caseData.patientBrief}
DIAGNOSIS: ${caseData.correctDiagnosis}
REQUIRED STEPS: ${caseData.keySteps.join(", ")}

TRANSCRIPT:
${messages.filter(m => m.role !== 'system').map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

JSON Output format:
{
  "overall": number (0-100),
  "dimensions": {
    "diagnosticAccuracy": number,
    "reasoningProcess": number,
    "keyStepCoverage": number,
    "safetyAwareness": number
  },
  "strengths": string[],
  "gaps": string[],
  "feedback": string,
  "grade": string (A-F)
}
`;

  const response = await getAiClient().models.generateContent({
    model: SCORING_MODEL,
    contents: [{ role: 'user', parts: [{ text: scoringPrompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overall: { type: Type.NUMBER },
          dimensions: {
            type: Type.OBJECT,
            properties: {
              diagnosticAccuracy: { type: Type.NUMBER },
              reasoningProcess: { type: Type.NUMBER },
              keyStepCoverage: { type: Type.NUMBER },
              safetyAwareness: { type: Type.NUMBER },
            },
            required: ["diagnosticAccuracy", "reasoningProcess", "keyStepCoverage", "safetyAwareness"]
          },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
          feedback: { type: Type.STRING },
          grade: { type: Type.STRING },
        },
        required: ["overall", "dimensions", "strengths", "gaps", "feedback", "grade"]
      }
    }
  });

  try {
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    console.error("Scoring parse failed:", e);
    return {
      overall: 70,
      dimensions: { diagnosticAccuracy: 70, reasoningProcess: 70, keyStepCoverage: 70, safetyAwareness: 70 },
      strengths: ["Completed simulation"],
      gaps: ["Evaluation parsing failed"],
      feedback: "Your evaluation was processed but the detailed report failed to generate.",
      grade: "B"
    };
  }
}
