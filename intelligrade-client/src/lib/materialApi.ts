// src/lib/materialApi.ts
// NOTE: This file is deprecated and not used by the current implementation
// The actual API calls are made directly in GenerateMaterialContent.tsx and PersonalizedFeedbackContent.tsx
// via Next.js proxy configured in next.config.ts
//
// BACKEND CONFIGURATION:
// - Backend service runs on port 8001 (configurable via PORT env var)
// - Endpoints: /generate-lesson-plan, /generate-feedback, /health
// - Next.js proxy: /api/edu/* → http://localhost:8001/*
//
// FRONTEND USAGE:
// - Components should use empty EDU_API_HOST to leverage Next.js proxy
// - Fetch calls go to /api/edu/generate-lesson-plan (proxied to backend)

const CHAT_API_HOST = process.env.NEXT_PUBLIC_CHAT_API_HOST || "";

/** Set to false to use real backend (mock disabled) */
const USE_MATERIAL_MOCK = false;

export interface GenerateMaterialParams {
  prompt: string;
  topic?: string;
  level?: "undergrad" | "graduate" | "k12";
  duration?: string; // "90min" etc.
  format?: "lesson-plan" | "slides";
}

export interface GenerateMaterialResult {
  markdown: string;
}

export async function generateMaterial(
  params: GenerateMaterialParams
): Promise<GenerateMaterialResult> {
  if (USE_MATERIAL_MOCK) {
    // Local mock: Generate structured Markdown for UI testing
    await wait(600);
    const title = params.topic?.trim() || "Sample Course";
    const header = `# ${title} (${labelLevel(params.level)} · ${params.duration || "90min"})`;

    const md = [
      header,
      "",
      "## Teaching Objectives",
      "- Understand core concepts and theoretical background",
      "- Master key theorems/formulas and apply flexibly",
      "- Solve basic to intermediate level typical problems",
      "",
      "## Prerequisites",
      "- Linear Algebra basics / Advanced Math basics",
      "- Logic and Set Theory basics",
      "",
      "## Course Outline (Suggested Schedule)",
      "1. Introduction and Motivation (10min)",
      "2. Core Concepts and Properties (25min)",
      "3. Example Problems Explained (25min)",
      "4. Class Activities and Discussion (20min)",
      "5. Summary and Common Pitfalls (10min)",
      "",
      "## Example Problems",
      "> Include 1-2 example problems with solution approaches and key points.",
      "",
      "## Class Activities",
      "- Group Discussion: Provide a small task with materials",
      "- Presentation and Peer Review: 2-3 minutes per group",
      "",
      "## Homework (Suggested)",
      "1. Basic Problems x3",
      "2. Advanced Problems x2",
      "3. Open-ended Problem x1 (Optional)",
      "",
      "## Evaluation Methods",
      "- Regular: Attendance/Participation/Homework (30%)",
      "- Midterm: Quiz/Project (30%)",
      "- Final: Closed/Open Book (40%)",
      "",
      "## Your Original Requirement (Prompt)",
      "```text",
      (params.prompt || "").trim(),
      "```",
    ].join("\n");
    return { markdown: md };
  }

  // Direct backend connection (FastAPI):
  // Backend provides POST /materials/generate returning { markdown: "..." }
  const res = await fetch(`${CHAT_API_HOST}/materials/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const data = await res.json();
  return { markdown: data.markdown || "" };
}

/* Utilities */
function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function labelLevel(l?: string) {
  if (l === "k12") return "K-12";
  if (l === "graduate") return "Graduate";
  return "Undergraduate";
}

