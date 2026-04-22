# MedMentor AI 🩺

**Empowering the next generation of clinicians through Socratic AI mentorship.**

MedMentor AI is a high-fidelity clinical reasoning simulator that bridges the gap between medical theory and practice. Using the Gemini 1.5 Flash precision engine, it facilitates Socratic dialogues where students are challenged to justify their diagnostic and treatment paths in a "safe-to-fail" environment.

![Bento Grid Theme](https://img.shields.io/badge/Theme-Bento_Grid-blue)
![AI Model](https://img.shields.io/badge/AI-Gemini_1.5_Flash-orange)
![Tech Stack](https://img.shields.io/badge/Stack-React_|_Vite_|_Tailwind-blue)

---

## 🚀 Features

### 📊 Intelligence Dashboard
*   **Performance Metrics**: Real-time tracking of average scores, streaks, and case volume.
*   **Gap Analysis**: Automatically identifies weak specialties based on session history.
*   **Daily Insights**: AI-generated "Tips for Today" focused on pushing your clinical boundaries.

### 🧪 Socratic Simulations
*   **Tiered Difficulty**: Tailored scenarios for Interns, Residents, and Attendings.
*   **Interactive Chat**: A dynamic, reasoning-first dialogue system where the AI challenges your assumptions.
*   **Rich Case Library**: Pre-defined templates across Cardiology, Pulmonology, Neurology, and more.

### 📈 Precision Analytics
*   **Dimension Matrix**: Evaluation across Diagnostic Accuracy, Reasoning Process, Key Step Coverage, and Safety Awareness.
*   **Narrative Feedback**: Detailed, AI-authored critiques of your clinical performance.
*   **Mastery Tracking**: Visual progress toward clinical competency thresholds.

### 📜 Clinical History
*   **Case Repository**: A complete searchable log of all past diagnostic paths and performance reports.

---

## 🛠️ Tech Stack

*   **Frontend**: React 19 (Vite)
*   **Styling**: Tailwind CSS 4.0 (Bento Grid Pattern)
*   **AI Engine**: Google Gemini 1.5 Flash (@google/genai)
*   **Animations**: Motion (formerly Framer Motion)
*   **Data Vis**: Recharts (Radar & Line Charts)
*   **Icons**: Lucide React

---

## ⚙️ Getting Started

### Prerequisites
*   Node.js (v18+)
*   An API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/medmentor-ai.git
   cd medmentor-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```text
src/
├── components/       # Reusable UI components (Sidebar, ProgressRing)
├── lib/              # Logic: AI Prompting, Scoring, Case Templates
├── pages/            # Core views (Dashboard, CaseSetup, CaseSession, Results, History)
├── types/            # TypeScript Interfaces
├── App.tsx           # Main routing and layout
└── index.css         # Global styles & Bento Grid theme
```

---

## 🛡️ License

This project is licensed under the Apache-2.0 License.

---

*“Medicine is learned by the bedside and not in the classroom.” – Sir William Osler*
