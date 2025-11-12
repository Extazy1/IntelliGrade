// src/lib/eduApi.ts
// Use proxy path to avoid CORS issues
// In production, this will be proxied by Next.js rewrites
export const EDU_API_HOST =
  process.env.NEXT_PUBLIC_EDU_API_HOST || "";

/** Lesson plan / Teaching materials generation */
export async function generateLessonPlan(data: {
  prompt: string;           // Your large prompt (free description of requirements)
  topic?: string;           // Course topic (optional)
  level?: "k12" | "undergrad" | "graduate";
  duration?: string;        // "45min" | "60min" | "90min" | ...
  format?: "lesson-plan" | "slides";
}) {
  const res = await fetch(`${EDU_API_HOST}/api/edu/generate-lesson-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to generate lesson plan (${res.status})`);
  }
  // Backend convention: returns { status, lesson_plan } or { markdown }
  const json = await res.json();
  return { markdown: json.lesson_plan ?? json.markdown ?? "" } as { markdown: string };
}

/** Personalized feedback & Learning plan */
export async function generateFeedback(data: {
  exam_file_url?: string;   // Exam paper link (optional)
  answers_text?: string;    // Answer text (optional)
  scores_text?: string;     // Score text/grades (optional)
}) {
  const res = await fetch(`${EDU_API_HOST}/api/edu/generate-feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to generate feedback (${res.status})`);
  }
  // Backend convention: returns { status, feedback } or { markdown }
  const json = await res.json();
  return { markdown: json.feedback ?? json.markdown ?? "" } as { markdown: string };
}

