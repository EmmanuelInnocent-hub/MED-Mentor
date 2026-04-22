import { Case } from "../types";

export const cases: Case[] = [
  {
    id: "chest-pain-01",
    title: "Acute Chest Pressure",
    specialty: "Cardiology",
    difficulty: "Resident",
    patientBrief: "A 52-year-old male presents to the ED with 2 hours of substernal chest pressure radiating to his left arm. He is diaphoretic and mildly short of breath. PMH: HTN, hyperlipidemia, former smoker.",
    correctDiagnosis: "STEMI",
    keySteps: ["ECG within 10 mins", "Aspirin", "Troponins", "Cath lab activation", "Anticoagulation"],
    commonMistakes: ["Delaying ECG", "Failure to activate cath lab", "Missing aspirin administration"]
  },
  {
    id: "dyspnea-02",
    title: "Shortness of Breath",
    specialty: "Pulmonology",
    difficulty: "Intern",
    patientBrief: "A 68-year-old female with a history of COPD and HFpEF presents with worsening shortness of breath for 3 days. She has a productive cough with yellow sputum and increased pedal edema.",
    correctDiagnosis: "COPD Exacerbation with possible Cor Pulmonale",
    keySteps: ["CXR", "Blood gas", "Albuterol/Ipratropium", "Steroids", "Antibiotics"],
    commonMistakes: ["Over-oxygenation in COPD", "Missing the heart failure component"]
  },
  {
    id: "neuro-03",
    title: "Sudden Weakness",
    specialty: "Neurology",
    difficulty: "Resident",
    patientBrief: "A 45-year-old female is brought in by family after sudden onset of right-sided weakness and difficulty speaking 45 minutes ago. History of migraines but no other significant PMH.",
    correctDiagnosis: "Acute Ischemic Stroke",
    keySteps: ["Non-contrast Head CT", "Neurology consult", "Blood glucose check", "Assess for tPA eligibility"],
    commonMistakes: ["Delaying Head CT", "Failure to check blood glucose (mimic)"]
  },
  {
    id: "gi-04",
    title: "Abdominal Pain",
    specialty: "GI",
    difficulty: "Attending",
    patientBrief: "A 24-year-old male presents with periumbilical pain that has shifted to the RLQ over the last 12 hours. He has nausea and was febrile (101.4F) at home. Positive McBurney's point tenderness.",
    correctDiagnosis: "Acute Appendicitis",
    keySteps: ["NPO status", "IV Fluids", "Surgical consult", "Abdominal Ultrasound or CT"],
    commonMistakes: ["Delaying surgical consult", "Giving oral meds/food"]
  }
];
