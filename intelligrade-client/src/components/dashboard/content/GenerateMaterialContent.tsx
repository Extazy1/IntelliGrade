"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Copy, Download, Sparkles, RotateCcw } from "lucide-react";

/** Backend address: defaults to 127.0.0.1:8000 per your requirements */
const EDU_API_HOST =
  process.env.NEXT_PUBLIC_EDU_API_HOST || "http://127.0.0.1:8000";

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

export default function GenerateMaterialContent() {
  // Fields matching backend one-to-one
  const [course_name, setCourseName] = useState("");
  const [teacher_name, setTeacherName] = useState("");
  const [target_audience, setTargetAudience] = useState("");
  const [class_duration, setClassDuration] = useState("");
  const [course_type, setCourseType] = useState("");
  const [teaching_goals, setTeachingGoals] = useState("");

  const [loading, setLoading] = useState(false);
  const [md, setMd] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // One-click fill example (using your provided JSON)
  const fillExample = () => {
    setCourseName("High School Math - Quadratic Functions: Graph and Properties");
    setTeacherName("Mr. Lee");
    setTargetAudience("High School Freshmen");
    setClassDuration("45 minutes");
    setCourseType("Theory Class");
    setTeachingGoals(
      "Understand the concept of quadratic functions; Master methods for drawing quadratic function graphs; Analyze function properties from graphs (monotonicity, extrema, etc.)"
    );
  };

  const onGenerate = async () => {
    // At least one field must be filled, otherwise prompt (recommend at least course name + goals)
    const allValues = [
      course_name,
      teacher_name,
      target_audience,
      class_duration,
      course_type,
      teaching_goals,
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
        course_name,
        teacher_name,
        target_audience,
        class_duration,
        course_type,
        teaching_goals,
      };

      interface LessonPlanResponse {
        lesson_plan?: string;
        markdown?: string;
        data?: string;
        result?: string;
      }

      const json = await safeFetchJSON<LessonPlanResponse>(
        `${EDU_API_HOST}/generate-lesson-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      // Compatible with backend returning {lesson_plan} or {markdown}
      const out =
        json?.lesson_plan ?? json?.markdown ?? json?.data ?? json?.result ?? "";
      if (!out) throw new Error("Backend returned no displayable content (lesson_plan/markdown is empty)");
      setMd(String(out));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Generation failed, please try again later.";
      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onCopy = async () => {
    if (!md) return;
    await navigator.clipboard.writeText(md);
  };

  const onDownload = () => {
    if (!md) return;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(course_name || "lesson").replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onClear = () => {
    setCourseName("");
    setTeacherName("");
    setTargetAudience("");
    setClassDuration("");
    setCourseType("");
    setTeachingGoals("");
    setMd("");
    setErr(null);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left side: Input form (fields match backend one-to-one) */}
      <div className="w-[460px] shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Lesson Plan / Teaching Material Generation</h2>
            
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

        <Input
          label="Course Name (course_name)"
          value={course_name}
          onChange={setCourseName}
          placeholder="High School Math - Quadratic Functions: Graph and Properties"
        />
        <Input
          label="Teacher Name (teacher_name)"
          value={teacher_name}
          onChange={setTeacherName}
          placeholder="Mr. Lee"
        />
        <Input
          label="Target Audience (target_audience)"
          value={target_audience}
          onChange={setTargetAudience}
          placeholder="High School Freshmen / Undergrad / ..."
        />
        <Input
          label="Class Duration (class_duration)"
          value={class_duration}
          onChange={setClassDuration}
          placeholder="45 minutes / 60 minutes / 90 minutes"
        />
        <Input
          label="Course Type (course_type)"
          value={course_type}
          onChange={setCourseType}
          placeholder="Theory Class / Lab Class / Discussion Class"
        />
        <TextArea
          label="Teaching Goals (teaching_goals)"
          value={teaching_goals}
          onChange={setTeachingGoals}
          placeholder="Describe desired learning outcomes and knowledge points"
        />

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
              "Generate Lesson Plan"
            )}
          </button>

          <button
            onClick={onClear}
            type="button"
            className="inline-flex items-center rounded border px-3 py-2 text-sm"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear
          </button>
        </div>

        {!!err && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            {err}
          </div>
        )}

        
      </div>

      {/* Right side: Markdown preview and actions */}
      <div className="min-w-0 flex-1 rounded-xl border bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium">Generated Result (Markdown Preview)</div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopy}
              disabled={!md}
              className="inline-flex items-center rounded border px-2 py-1 text-xs"
              title="Copy Markdown"
              type="button"
            >
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </button>
            <button
              onClick={onDownload}
              disabled={!md}
              className="inline-flex items-center rounded border px-2 py-1 text-xs"
              title="Download .md"
              type="button"
            >
              <Download className="mr-1 h-3 w-3" />
              Download
            </button>
          </div>
        </div>

        <div className="h-[calc(100%-1.75rem)] overflow-auto rounded border bg-gray-50 p-4 prose prose-sm max-w-none">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating content…
            </div>
          ) : md ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          ) : (
            <div className="text-gray-400">Generated Markdown will be displayed here.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Simple input component */
function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-gray-600">{label}</div>
      <input
        className="w-full rounded border px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-gray-600">{label}</div>
      <textarea
        className="w-full rounded border px-3 py-2 text-sm min-h-[100px] resize-y"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

