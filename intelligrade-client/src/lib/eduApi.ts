// src/lib/eduApi.ts
export const EDU_API_HOST =
  process.env.NEXT_PUBLIC_EDU_API_HOST || "http://localhost:8000";

/** Lesson plan / Teaching materials generation */
export async function generateLessonPlan(data: {
  prompt: string;           // Your large prompt (free description of requirements)
  topic?: string;           // Course topic (optional)
  level?: "k12" | "undergrad" | "graduate";
  duration?: string;        // "45min" | "60min" | "90min" | ...
  format?: "lesson-plan" | "slides";
}) {
  const res = await fetch(`${EDU_API_HOST}/generate-lesson-plan`, {
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
  const res = await fetch(`${EDU_API_HOST}/generate-feedback`, {
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

