import { GoogleGenAI, Type } from "@google/genai";
import { Case, Message } from "../types";

// Always initialize with the process.env key in this format for Vite
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const MODEL_NAME = "gemini-3-flash-preview";

export function buildSystemPrompt(caseData: Case, difficulty: string) {
  return `
You are MedMentor, a Socratic clinical reasoning tutor for medical students.
You are running a case-based learning session.

PATIENT CASE:
${caseData.patientBrief}

YOUR ROLE:
- Never reveal the diagnosis directly.
- Ask ONE focused question at a time.
- After each student response, assess: Did they identify the right priorities?
- If they miss something critical (like ordering an ECG for chest pain), ask "What diagnostic tools might help clarify this presentation?"
- Respect the student's input but guide them back if they drift too far.
- Track internally which key clinical steps they've mentioned: ${caseData.keySteps.join(", ")}
- After approximately 8-10 exchanges, or when the student seems to have a clear plan, say: "Let's wrap up this case. Please state your working diagnosis and final management plan."
- Difficulty level: ${difficulty}. At "Intern" level, give more hints and encouragement. At "Attending" level, be more challenging and push for deep physiological reasoning.

TONE: Calm, encouraging, professional, and Socratic. Like a brilliant attending who respects the learner.
  `.trim();
}

export async function getChatResponse(messages: Message[]) {
  const chatContents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  // Gemini API requires the conversation to start with a 'user' message.
  // If the assistant starts the conversation (which we do with our initial greeting),
  // we shift the history or handle it so the API doesn't reject it.
  const refinedContents = chatContents[0]?.role === 'model' 
    ? chatContents.slice(1) 
    : chatContents;

  // If there are no user messages yet, we shouldn't send an empty request
  if (refinedContents.length === 0) {
    return "I'm ready to begin the simulation. What are your first steps?";
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: refinedContents as any,
    config: {
      systemInstruction: systemPromptContent(messages),
      temperature: 0.7,
    },
  });

  return response.text || "I'm sorry, I'm processing that information. Can you repeat your last observation?";
}

function systemPromptContent(messages: Message[]): string {
  const system = messages.find(m => m.role === 'system');
  return system?.content || "You are a medical tutor.";
}

export async function scoreSession(messages: Message[], caseData: Case) {
  const scoringPrompt = `
You are evaluating a medical student's clinical reasoning session.

CASE: ${caseData.patientBrief}
CORRECT DIAGNOSIS: ${caseData.correctDiagnosis}
KEY CLINICAL STEPS REQUIRED: ${caseData.keySteps.join(", ")}
COMMON MISTAKES: ${caseData.commonMistakes.join(", ")}

STUDENT CONVERSATION:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

Score the student on these dimensions (0-100 each):
1. Diagnostic Accuracy - Did they reach the right diagnosis?
2. Clinical Reasoning Process - Did they think systematically?
3. Key Step Coverage - How many required steps did they mention?
4. Safety Awareness - Did they prioritize life-threatening causes first?

Return a JSON object:
{
  "overall": number,
  "dimensions": {
    "diagnosticAccuracy": number,
    "reasoningProcess": number,
    "keyStepCoverage": number,
    "safetyAwareness": number
  },
  "strengths": string[],
  "gaps": string[],
  "feedback": string,
  "grade": string
}
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ parts: [{ text: scoringPrompt }] }],
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
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse scoring response", e);
    throw new Error("Invalid scoring response from AI");
  }
}
