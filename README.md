# ReviewAI - AI Application Reviewer

AI-powered application review platform that ingests applications, evaluates them using configurable rules, simulates panel reviews with AI personas, and generates transparent justification reports.

## Features

### Free Plan
- **Application Ingestion** — CSV import or individual entry
- **Rule-Based Evaluation** — Configurable rules with weight and strictness
- **Single AI Persona** — Balanced technical evaluation
- **Justification Reports** — Strengths, weaknesses, rule influences, confidence scores

### Pro Plan
- **Panel Reviews** — Multiple AI reviewer personas with distinct evaluation styles
- **Automated Shortlisting** — Ranked applications with classification tiers
- **Multi-Level Classification** — Trailblazer, Rising Star, Needs Development, Not Selected
- **Context-Aware Evaluation** — Optional diversity toggles (gender, racial, geographic)

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend:** Express.js, Node.js
- **AI Engine:** Anthropic Claude (with rule-based fallback)
- **Build:** Vite, esbuild

## Getting Started

```bash
npm install
npm run dev
```

The dev server starts on port 5000.

## Review Modes

- **Human-in-the-Loop** — AI recommends, you approve or override
- **Autonomous** — AI makes final decisions automatically

## Classification Tiers

| Tier | Score Range | Description |
|------|------------|-------------|
| Trailblazer | 8-10 | Exceptional candidate |
| Rising Star | 6-7.9 | Strong potential |
| Needs Development | 4-5.9 | Room for growth |
| Not Selected | 0-3.9 | Does not meet requirements |

## License

MIT
