"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Copy, Download, Sparkles } from "lucide-react";

/** Backend address: use proxy path to avoid CORS */
const EDU_API_HOST =
  process.env.NEXT_PUBLIC_EDU_API_HOST || "";

interface ErrorResponse {
  error?: { message?: string };
  detail?: { message?: string } | string;
}

/** Safe request (with timeout and error message extraction) */
async function safeFetchJSON<T>(
  url: string,
  init: RequestInit,
  timeoutMs = 60_000
): Promise<T> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await res.text();
    let data: ErrorResponse | T | null = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // Not JSON
    }
    if (!res.ok) {
      const errorData = data as ErrorResponse;
      const msg =
        (errorData && (errorData.error?.message || 
          (typeof errorData.detail === 'object' ? errorData.detail?.message : errorData.detail))) ||
        text ||
        `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return (data ?? {}) as T;
  } finally {
    clearTimeout(id);
  }
}

export default function PersonalizedFeedbackContent() {
  // Fields matching backend one-to-one
  const [student_name, setStudentName] = useState("");
  const [grade_class, setGradeClass] = useState("");
  const [learning_features, setLearningFeatures] = useState("");
  const [exam_name, setExamName] = useState("");
  const [exam_scope, setExamScope] = useState("");
  const [full_score, setFullScore] = useState("");
  const [student_score, setStudentScore] = useState("");
  const [exam_difficulty, setExamDifficulty] = useState("");
  const [strong_types, setStrongTypes] = useState("");
  const [weak_types, setWeakTypes] = useState("");
  const [error_examples, setErrorExamples] = useState("");
  const [lost_points_reason, setLostPointsReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [md, setMd] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // One-click fill example (using your provided JSON)
  const fillExample = () => {
    setStudentName("John Wang");
    setGradeClass("High School Class 1-3");
    setLearningFeatures(
      "Strong logical thinking, high sensitivity to geometry problems, but prone to calculation errors and weak memorization of basic formulas"
    );
    setExamName("High School Math First Monthly Exam");
    setExamScope("Required Course 1 Chapters 1-3 (Sets, Function Concepts, and Basic Elementary Functions)");
    setFullScore("150 points");
    setStudentScore("108 points");
    setExamDifficulty("Medium");
    setStrongTypes("Geometry application problems, set selection questions");
    setWeakTypes("Function monotonicity proof problems, piecewise function evaluation problems");
    setErrorExamples(
      "1. Question 12: Miscalculated due to incorrect quadratic function vertex formula; 2. Question 20: Ignored function domain range, incomplete proof process"
    );
    setLostPointsReason(
      "Weak memorization of basic formulas; non-standard calculation steps, prone to skipping steps; not careful when reviewing complex problems"
    );
  };

  const onGenerate = async () => {
    // At least one field must be filled, otherwise prompt
    const allValues = [
      student_name,
      grade_class,
      learning_features,
      exam_name,
      exam_scope,
      full_score,
      student_score,
      exam_difficulty,
      strong_types,
      weak_types,
      error_examples,
      lost_points_reason,
    ].map((v) => v.trim());
    if (allValues.every((v) => !v)) {
      setErr("Please fill in at least one field (suggest clicking &apos;Fill Example&apos; to experience)");
      return;
    }

    setLoading(true);
    setErr(null);
    setMd("");

    try {
      // Strictly use your required body field names
      const body = {
        student_name,
        grade_class,
        learning_features,
        exam_name,
        exam_scope,
        full_score,
        student_score,
        exam_difficulty,
        strong_types,
        weak_types,
        error_examples,
        lost_points_reason,
      };

      interface FeedbackResponse {
        feedback?: string;
        markdown?: string;
        data?: string;
        result?: string;
      }

      const json = await safeFetchJSON<FeedbackResponse>(
        `${EDU_API_HOST}/api/edu/generate-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      // Compatible with backend returning {feedback} or {markdown}
      const out =
        json?.feedback ?? json?.markdown ?? json?.data ?? json?.result ?? "";
      if (!out) throw new Error("Backend returned no displayable content (feedback/markdown is empty)");
      setMd(String(out));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Generation failed, please try again later.";
      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyMd = async () => {
    if (!md) return;
    await navigator.clipboard.writeText(md);
  };

  const downloadMd = () => {
    if (!md) return;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(student_name || "feedback").replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Personalized Feedback & Learning Plan</h2>
          
        </div>
        <button
          onClick={fillExample}
          type="button"
          className="inline-flex items-center rounded border px-3 py-2 text-sm"
          title="Fill Example"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Fill Example
        </button>
      </div>

      {/* Form: Fields match backend one-to-one */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="Student Name (student_name)" value={student_name} onChange={setStudentName} />
        <Input label="Grade/Class (grade_class)" value={grade_class} onChange={setGradeClass} />
        <TextArea
          label="Learning Features (learning_features)"
          value={learning_features}
          onChange={setLearningFeatures}
        />
        <Input label="Exam Name (exam_name)" value={exam_name} onChange={setExamName} />
        <Input label="Exam Scope (exam_scope)" value={exam_scope} onChange={setExamScope} />
        <Input label="Full Score (full_score)" value={full_score} onChange={setFullScore} />
        <Input label="Student Score (student_score)" value={student_score} onChange={setStudentScore} />
        <Input
          label="Exam Difficulty (exam_difficulty)"
          value={exam_difficulty}
          onChange={setExamDifficulty}
        />
        <Input label="Strong Question Types (strong_types)" value={strong_types} onChange={setStrongTypes} />
        <Input label="Weak Question Types (weak_types)" value={weak_types} onChange={setWeakTypes} />
        <TextArea
          label="Typical Errors (error_examples)"
          value={error_examples}
          onChange={setErrorExamples}
        />
        <TextArea
          label="Points Lost Reasons (lost_points_reason)"
          value={lost_points_reason}
          onChange={setLostPointsReason}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onGenerate}
          disabled={loading}
          className={`inline-flex items-center rounded px-3 py-2 text-sm text-white ${
            loading ? "bg-gray-400" : "bg-black hover:opacity-90"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate Feedback"
          )}
        </button>

        <button
          onClick={copyMd}
          disabled={!md}
          className="inline-flex items-center rounded border px-3 py-2 text-sm"
          title="Copy Markdown"
          type="button"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </button>

        <button
          onClick={downloadMd}
          disabled={!md}
          className="inline-flex items-center rounded border px-3 py-2 text-sm"
          title="Download .md"
          type="button"
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </button>
      </div>

      {!!err && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {err}
        </div>
      )}

      {/* Result area */}
      <div className="flex-1 overflow-auto rounded border bg-white p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </div>
        ) : md ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-gray-400">Generated Markdown will be displayed here.</div>
        )}
      </div>
    </div>
  );
}

/** Simple input component */
function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-gray-600">{label}</div>
      <input
        className="w-full rounded border px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block col-span-1 md:col-span-2">
      <div className="mb-1 text-xs text-gray-600">{label}</div>
      <textarea
        className="w-full rounded border px-3 py-2 text-sm min-h-[80px] resize-y"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

