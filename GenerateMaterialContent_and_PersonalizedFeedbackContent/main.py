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


# ========= 0) 配置 =========
# 从环境变量读取（更安全）
API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-0417c99a0fa4443a9351febeb1e1b9e6").strip()
BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").strip()

if not API_KEY:
    print("⚠️  WARNING: 环境变量 DEEPSEEK_API_KEY 未设置，将导致后端无法生成内容。")

# ========= 1) FastAPI & CORS =========
app = FastAPI(
    title="AI 智能教育助手 API",
    description="课程教案生成 + 个性化学习反馈",
    version="2.1.0",
)

# 放最前面，确保预检由中间件处理
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
    allow_methods=["*"],     # 允许 OPTIONS/POST 等
    allow_headers=["*"],     # 允许 Content-Type/Authorization 等
)

@app.get("/health")
def health():
    return {"status": "ok"}


# ========= 2) 工具 & 验证 =========
class MarkdownValidationError(Exception):
    pass

def validate_markdown(text: str, required_headings: List[str]) -> str:
    if not isinstance(text, str) or not text.strip():
        raise MarkdownValidationError("AI 模型返回为空。")
    missing = [h for h in required_headings if h not in text]
    if missing:
        raise MarkdownValidationError(f"缺少必要标题: {', '.join(missing)}")
    return text


# ========= 3) LLM 初始化 =========
def build_llm(temp: float, max_tokens: int) -> ChatOpenAI:
    if not API_KEY:
        # 占位 LLM：没有 key 时抛错提示
        raise RuntimeError("DEEPSEEK_API_KEY 未配置")
    return ChatOpenAI(
        model="deepseek-chat",
        api_key=API_KEY,
        base_url=BASE_URL,
        temperature=temp,
        max_tokens=max_tokens,
    )

# 教案链
prompt_lesson_plan = ChatPromptTemplate.from_messages([
    ("system", """
<role>
你是一个顶级课程设计 AI，专注于创建格式完美的 Markdown 教案。
</role>
<instructions>
1) 仅根据 `<input_data>` 与可选的 `<custom_prompt>` 生成教案；
2) 必须严格遵循 `<output_format>` 标题结构；
3) 回答必须以第一个 Markdown 标题开始，不能有其它前缀；
4) 所有占位符用具体内容替换。
</instructions>
<output_format>
## 1. 教学重点与难点
- **重点**: [具体内容]
- **难点**: [具体内容]
## 2. 教学准备
- **教具**: [具体内容]
- **课件**: [具体内容]
- **前置知识**: [具体内容]
## 3. 教学过程设计
- **步骤一：导入 (XX分钟)**: [具体内容]
- **步骤二：新知讲解 (XX分钟)**: [具体内容]
- **步骤三：互动与练习 (XX分钟)**: [具体内容]
- **步骤四：总结 (XX分钟)**: [具体内容]
## 4. 板书设计或PPT结构
- [具体内容]
## 5. 课堂练习与作业布置
- **课堂练习**: [具体内容]
- **课后作业**: [具体内容]
## 6. 教学反思与改进建议
- **预设问题**: [具体内容]
- **解决方案**: [具体内容]
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

# 反馈链
prompt_student_feedback = ChatPromptTemplate.from_messages([
    ("system", """
    <role>
    你是一位富有同理心的**老师**，正在为学生撰写个性化学习反馈和规划。
    </role>
    <instructions>
    1) 输出必须使用**第二人称**（使用“你”、“你的”）与学生直接交流，语气要亲切且有指导性。
    2) 必须严格遵循以下 **Markdown 标题结构**，并以第一个一级标题 `# 学习反馈` 直接开始，不能有任何前缀。
    </instructions>
    <output_format>
    # 学习反馈
    ## 🌟 本次考试亮点
    [具体内容，直接对学生说“你做得好”等]
    ## 🧐 待提升环节分析
    [具体内容，分析“你”的薄弱点]
    # 学习规划
    ## 🚀 一周提升计划
    [具体内容，指导“你”本周如何行动]
    ## 🌱 长期发展建议
    [具体内容，给出“你”的长期学习方向]
    </output_format>
    """),
    ("user", """
<student_data>
  <basic_info>
    - 姓名：{student_name}
    - 年级班级：{grade_class}
    - 学习特点：{learning_features}
  </basic_info>
  <exam_info>
    - 试卷：{exam_name}
    - 范围：{exam_scope}
    - 满分：{full_score}
    - 得分：{student_score}
    - 难度：{exam_difficulty}
  </exam_info>
  <performance_summary>
    - 优势题型：{strong_types}
    - 薄弱题型：{weak_types}
    - 典型错误：{error_examples}
    - 失分原因：{lost_points_reason}
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


# ========= 4) 入参模型（兼容“结构化字段”与“大 Prompt”） =========
class LessonPlanParams(BaseModel):
    # 结构化字段（原后端）
    course_name: Optional[str] = None
    teacher_name: Optional[str] = None
    target_audience: Optional[str] = None
    class_duration: Optional[str] = None
    course_type: Optional[str] = None
    teaching_goals: Optional[str] = None
    # 大 Prompt（前端可能直接给一句话）
    prompt: Optional[str] = None

class FeedbackParams(BaseModel):
    # 结构化字段（原后端）
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
    # 简易三项（你前端最初版本）
    exam_file_url: Optional[str] = None
    answers_text: Optional[str] = None
    scores_text: Optional[str] = None


# ========= 5) 路由 =========
@app.post("/generate-lesson-plan", summary="生成课程教案", tags=["教案生成"])
async def create_lesson_plan(params: LessonPlanParams):
    try:
        # 兜底：把 None 替换成字符串，避免模板出现 'None'
        def norm(x: Optional[str], default="无") -> str:
            return (x or "").strip() or default

        # custom_prompt：若传了 prompt，就拼到 custom_prompt；否则为空
        custom_prompt = norm(params.prompt, "")

        input_vars = {
            "course_name":     norm(params.course_name, "未指定课程"),
            "teacher_name":    norm(params.teacher_name, "未指定教师"),
            "target_audience": norm(params.target_audience, "未指定人群"),
            "class_duration":  norm(params.class_duration, "90min"),
            "course_type":     norm(params.course_type, "理论课"),
            "teaching_goals":  norm(params.teaching_goals, custom_prompt or "请根据主题与目标合理设计"),
            "custom_prompt":   custom_prompt,
        }

        # 生成
        llm = build_llm(temp=0.2, max_tokens=2000)
        raw_output = await (prompt_lesson_plan | llm | StrOutputParser()).ainvoke(input_vars)

        # 验证标题
        required_headings = [
            "## 1. 教学重点与难点",
            "## 2. 教学准备",
            "## 3. 教学过程设计",
            "## 4. 板书设计或PPT结构",
            "## 5. 课堂练习与作业布置",
            "## 6. 教学反思与改进建议",
        ]
        validated = validate_markdown(raw_output, required_headings)
        return {"status": "success", "lesson_plan": validated}

    except MarkdownValidationError as e:
        print(f"❌ Markdown validation error: {e}")
        raise HTTPException(status_code=422, detail=f"教案结构校验失败: {e}")
    except RuntimeError as e:
        # API Key 未配置等
        print(f"❌ Runtime error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        import traceback
        print(f"❌ Unexpected error: {type(e).__name__}: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"内部错误: {type(e).__name__}: {str(e)}")


@app.post("/generate-feedback", summary="生成个性化学习反馈", tags=["学生反馈"])
async def create_feedback(params: FeedbackParams):
    try:
        def norm(x: Optional[str], default="无") -> str:
            return (x or "").strip() or default

        input_vars = {
            # 结构化
            "student_name":      norm(params.student_name, "学生"),
            "grade_class":       norm(params.grade_class, "未指定"),
            "learning_features": norm(params.learning_features, "未提供"),
            "exam_name":         norm(params.exam_name, "未命名试卷"),
            "exam_scope":        norm(params.exam_scope, "未提供"),
            "full_score":        norm(params.full_score, "100"),
            "student_score":     norm(params.student_score, "未提供"),
            "exam_difficulty":   norm(params.exam_difficulty, "中等"),
            "strong_types":      norm(params.strong_types, "未提供"),
            "weak_types":        norm(params.weak_types, "未提供"),
            "error_examples":    norm(params.error_examples, "未提供"),
            "lost_points_reason":norm(params.lost_points_reason, "未提供"),
            # 简易三项
            "exam_file_url": norm(params.exam_file_url, ""),
            "answers_text":  norm(params.answers_text, ""),
            "scores_text":   norm(params.scores_text, ""),
        }

        llm = build_llm(temp=0.6, max_tokens=2500)
        raw_output = await (prompt_student_feedback | llm | StrOutputParser()).ainvoke(input_vars)

        required_headings = [
            "# 学习反馈",
            "## 🌟 本次考试亮点",
            "## 🧐 待提升环节分析",
            "# 学习规划",
            "## 🚀 一周提升计划",
            "## 🌱 长期发展建议",
        ]
        validated = validate_markdown(raw_output, required_headings)
        return {"status": "success", "feedback": validated}

    except MarkdownValidationError as e:
        print(f"❌ Markdown validation error: {e}")
        raise HTTPException(status_code=422, detail=f"反馈结构校验失败: {e}")
    except RuntimeError as e:
        print(f"❌ Runtime error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        import traceback
        print(f"❌ Unexpected error: {type(e).__name__}: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"内部错误: {type(e).__name__}: {str(e)}")


# === 预检兜底（正常情况下 CORSMiddleware 已处理，这里仅为保险） ===
@app.options("/generate-lesson-plan")
def _opt_lp():
    return Response(status_code=204)
@app.options("/generate-feedback")
def _opt_fb():
    return Response(status_code=204)


# ========= 6) 统一错误响应（可选） =========
@app.exception_handler(HTTPException)
async def http_ex_handler(_: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        payload = {"error": exc.detail}
    else:
        payload = {"error": {"message": str(exc.detail)}}
    return JSONResponse(payload, status_code=exc.status_code)


# ========= 7) 启动 =========
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
