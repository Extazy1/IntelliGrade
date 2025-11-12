import os
import uvicorn
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser


# ========= 0) Configuration =========
# Read from environment variables (more secure)
API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-0417c99a0fa4443a9351febeb1e1b9e6").strip()
BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").strip()

if not API_KEY:
    print("WARNING: DEEPSEEK_API_KEY environment variable not set. Backend cannot generate content.")

# ========= 1) FastAPI & CORS =========
app = FastAPI(
    title="AI Education Assistant API",
    description="Lesson Plan Generation + Personalized Learning Feedback",
    version="2.1.0",
)

# Place at the top to ensure preflight requests are handled by middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://47.82.94.221",
        "http://47.82.94.221:3000",
        "https://47.82.94.221",
    ],
    allow_credentials=True,
    allow_methods=["*"],     # Allow OPTIONS/POST etc.
    allow_headers=["*"],     # Allow Content-Type/Authorization etc.
)

@app.get("/health")
def health():
    return {"status": "ok"}


# ========= 2) Utilities & Validation =========
class MarkdownValidationError(Exception):
    pass

def validate_markdown(text: str, required_headings: List[str]) -> str:
    if not isinstance(text, str) or not text.strip():
        raise MarkdownValidationError("AI model returned empty content.")
    missing = [h for h in required_headings if h not in text]
    if missing:
        raise MarkdownValidationError(f"Missing required headings: {', '.join(missing)}")
    return text


# ========= 3) LLM Initialization =========
def build_llm(temp: float, max_tokens: int) -> ChatOpenAI:
    if not API_KEY:
        # Placeholder LLM: throw error when no key
        raise RuntimeError("DEEPSEEK_API_KEY not configured")
    return ChatOpenAI(
        model="deepseek-chat",
        api_key=API_KEY,
        base_url=BASE_URL,
        temperature=temp,
        max_tokens=max_tokens,
    )

# Lesson Plan Chain
prompt_lesson_plan = ChatPromptTemplate.from_messages([
    ("system", """
<role>
You are a top-tier course design AI, specialized in creating perfectly formatted Markdown lesson plans.
</role>
<instructions>
1) Generate the lesson plan based solely on `<input_data>` and optional `<custom_prompt>`;
2) Strictly follow the `<output_format>` heading structure;
3) Your response MUST start with the first Markdown heading, without any other prefix;
4) Replace all placeholders with specific content.
</instructions>
<output_format>
## 1. Key Points and Difficulties
- **Key Points**: [specific content]
- **Difficulties**: [specific content]
## 2. Teaching Preparation
- **Teaching Aids**: [specific content]
- **Course Materials**: [specific content]
- **Prerequisites**: [specific content]
## 3. Teaching Process Design
- **Step 1: Introduction (XX minutes)**: [specific content]
- **Step 2: New Knowledge Explanation (XX minutes)**: [specific content]
- **Step 3: Interaction and Practice (XX minutes)**: [specific content]
- **Step 4: Summary (XX minutes)**: [specific content]
## 4. Blackboard Design or PPT Structure
- [specific content]
## 5. Class Exercises and Homework Assignment
- **Class Exercises**: [specific content]
- **Homework**: [specific content]
## 6. Teaching Reflection and Improvement Suggestions
- **Anticipated Issues**: [specific content]
- **Solutions**: [specific content]
</output_format>
"""),
    ("user", """
<input_data>
  <course_name>{course_name}</course_name>
  <teacher_name>{teacher_name}</teacher_name>
  <target_audience>{target_audience}</target_audience>
  <class_duration>{class_duration}</class_duration>
  <course_type>{course_type}</course_type>
  <teaching_goals>{teaching_goals}</teaching_goals>
</input_data>

<custom_prompt>{custom_prompt}</custom_prompt>
""")
])
chain_lesson_plan = prompt_lesson_plan | StrOutputParser()

# Feedback Chain
prompt_student_feedback = ChatPromptTemplate.from_messages([
    ("system", """
    <role>
    You are an empathetic **teacher** writing personalized learning feedback and planning for students.
    </role>
    <instructions>
    1) Output MUST use **second person** (use "you", "your") to communicate directly with the student, with a warm and guiding tone.
    2) MUST strictly follow the **Markdown heading structure** below, starting directly with the first level heading `# Learning Feedback`, without any prefix.
    </instructions>
    <output_format>
    # Learning Feedback
    ## 🌟 Exam Highlights
    [specific content, directly tell the student "you did well" etc.]
    ## 🧐 Areas for Improvement Analysis
    [specific content, analyze "your" weak points]
    # Learning Plan
    ## 🚀 One-Week Improvement Plan
    [specific content, guide "you" on how to take action this week]
    ## 🌱 Long-term Development Suggestions
    [specific content, provide "your" long-term learning direction]
    </output_format>
    """),
    ("user", """
<student_data>
  <basic_info>
    - Name: {student_name}
    - Grade/Class: {grade_class}
    - Learning Features: {learning_features}
  </basic_info>
  <exam_info>
    - Exam: {exam_name}
    - Scope: {exam_scope}
    - Full Score: {full_score}
    - Student Score: {student_score}
    - Difficulty: {exam_difficulty}
  </exam_info>
  <performance_summary>
    - Strong Types: {strong_types}
    - Weak Types: {weak_types}
    - Typical Errors: {error_examples}
    - Points Lost Reason: {lost_points_reason}
  </performance_summary>
  <raw_inputs>
    - exam_file_url: {exam_file_url}
    - answers_text: {answers_text}
    - scores_text: {scores_text}
  </raw_inputs>
</student_data>
""")
])
chain_student_feedback = prompt_student_feedback | StrOutputParser()


# ========= 4) Request Models (Compatible with structured fields and large Prompt) =========
class LessonPlanParams(BaseModel):
    # Structured fields (from original backend)
    course_name: Optional[str] = None
    teacher_name: Optional[str] = None
    target_audience: Optional[str] = None
    class_duration: Optional[str] = None
    course_type: Optional[str] = None
    teaching_goals: Optional[str] = None
    # Large Prompt (frontend may provide a single sentence)
    prompt: Optional[str] = None

class FeedbackParams(BaseModel):
    # Structured fields (from original backend)
    student_name: Optional[str] = None
    grade_class: Optional[str] = None
    learning_features: Optional[str] = None
    exam_name: Optional[str] = None
    exam_scope: Optional[str] = None
    full_score: Optional[str] = None
    student_score: Optional[str] = None
    exam_difficulty: Optional[str] = None
    strong_types: Optional[str] = None
    weak_types: Optional[str] = None
    error_examples: Optional[str] = None
    lost_points_reason: Optional[str] = None
    # Simple three fields (from initial frontend version)
    exam_file_url: Optional[str] = None
    answers_text: Optional[str] = None
    scores_text: Optional[str] = None


# ========= 5) Routes =========
@app.post("/generate-lesson-plan", summary="Generate Lesson Plan", tags=["Lesson Plan"])
async def create_lesson_plan(params: LessonPlanParams):
    try:
        # Fallback: Replace None with string to avoid 'None' in template
        def norm(x: Optional[str], default="N/A") -> str:
            return (x or "").strip() or default

        # custom_prompt: If prompt is provided, use it; otherwise empty
        custom_prompt = norm(params.prompt, "")

        input_vars = {
            "course_name":     norm(params.course_name, "Unspecified Course"),
            "teacher_name":    norm(params.teacher_name, "Unspecified Teacher"),
            "target_audience": norm(params.target_audience, "Unspecified Audience"),
            "class_duration":  norm(params.class_duration, "90min"),
            "course_type":     norm(params.course_type, "Theory Class"),
            "teaching_goals":  norm(params.teaching_goals, custom_prompt or "Design appropriately based on topic and objectives"),
            "custom_prompt":   custom_prompt,
        }

        # Generate
        llm = build_llm(temp=0.2, max_tokens=2000)
        raw_output = await (prompt_lesson_plan | llm | StrOutputParser()).ainvoke(input_vars)

        # Validate headings
        required_headings = [
            "## 1. Key Points and Difficulties",
            "## 2. Teaching Preparation",
            "## 3. Teaching Process Design",
            "## 4. Blackboard Design or PPT Structure",
            "## 5. Class Exercises and Homework Assignment",
            "## 6. Teaching Reflection and Improvement Suggestions",
        ]
        validated = validate_markdown(raw_output, required_headings)
        return {"status": "success", "lesson_plan": validated}

    except MarkdownValidationError as e:
        print(f"Markdown validation error: {e}")
        raise HTTPException(status_code=422, detail=f"Lesson plan structure validation failed: {e}")
    except RuntimeError as e:
        # API Key not configured, etc.
        print(f"Runtime error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        import traceback
        print(f"Unexpected error: {type(e).__name__}: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal error: {type(e).__name__}: {str(e)}")


@app.post("/generate-feedback", summary="Generate Personalized Learning Feedback", tags=["Student Feedback"])
async def create_feedback(params: FeedbackParams):
    try:
        def norm(x: Optional[str], default="N/A") -> str:
            return (x or "").strip() or default

        input_vars = {
            # Structured fields
            "student_name":      norm(params.student_name, "Student"),
            "grade_class":       norm(params.grade_class, "Unspecified"),
            "learning_features": norm(params.learning_features, "Not provided"),
            "exam_name":         norm(params.exam_name, "Unnamed Exam"),
            "exam_scope":        norm(params.exam_scope, "Not provided"),
            "full_score":        norm(params.full_score, "100"),
            "student_score":     norm(params.student_score, "Not provided"),
            "exam_difficulty":   norm(params.exam_difficulty, "Medium"),
            "strong_types":      norm(params.strong_types, "Not provided"),
            "weak_types":        norm(params.weak_types, "Not provided"),
            "error_examples":    norm(params.error_examples, "Not provided"),
            "lost_points_reason":norm(params.lost_points_reason, "Not provided"),
            # Simple three fields
            "exam_file_url": norm(params.exam_file_url, ""),
            "answers_text":  norm(params.answers_text, ""),
            "scores_text":   norm(params.scores_text, ""),
        }

        llm = build_llm(temp=0.6, max_tokens=2500)
        raw_output = await (prompt_student_feedback | llm | StrOutputParser()).ainvoke(input_vars)

        required_headings = [
            "# Learning Feedback",
            "## 🌟 Exam Highlights",
            "## 🧐 Areas for Improvement Analysis",
            "# Learning Plan",
            "## 🚀 One-Week Improvement Plan",
            "## 🌱 Long-term Development Suggestions",
        ]
        validated = validate_markdown(raw_output, required_headings)
        return {"status": "success", "feedback": validated}

    except MarkdownValidationError as e:
        print(f"Markdown validation error: {e}")
        raise HTTPException(status_code=422, detail=f"Feedback structure validation failed: {e}")
    except RuntimeError as e:
        print(f"Runtime error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        import traceback
        print(f"Unexpected error: {type(e).__name__}: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal error: {type(e).__name__}: {str(e)}")


# === Preflight fallback (normally handled by CORSMiddleware, this is just insurance) ===
@app.options("/generate-lesson-plan")
def _opt_lp():
    return Response(status_code=204)
@app.options("/generate-feedback")
def _opt_fb():
    return Response(status_code=204)


# ========= 6) Unified Error Response (optional) =========
@app.exception_handler(HTTPException)
async def http_ex_handler(_: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        payload = {"error": exc.detail}
    else:
        payload = {"error": {"message": str(exc.detail)}}
    return JSONResponse(payload, status_code=exc.status_code)


# ========= 7) Startup =========
if __name__ == "__main__":
    # Use port 8001 to match Next.js proxy configuration
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
