# -*- coding: utf-8 -*-
import time
import mimetypes
from typing import List, Optional

from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag_system import rag, UPLOAD_DIR

app = FastAPI(title="RAG Two-Routes API", version="1.0.0")

# CORS（按需调整）
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://47.82.94.221:3000",
        "http://47.82.94.221",
        "https://47.82.94.221",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- 数据模型 ----
class Message(BaseModel):
    role: Optional[str] = "user"
    content: str

class ChatJSONPayload(BaseModel):
    message: Message

def make_assistant_message(content: str, attachments: Optional[List[dict]] = None) -> dict:
    return {
        "assistantMessage": {
            "id": f"msg_{int(time.time()*1000)}",
            "role": "assistant",
            "content": content,
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "attachments": attachments or [],
        }
    }

# =========================================================
# 1) 直连模型（不走 RAG）：POST /api/chat/messages/direct
#    仅接受 JSON：{ "message": { "content": "..." } }
# =========================================================
@app.post("/api/chat/messages/direct")
async def direct_chat(payload: ChatJSONPayload):
    user_text = (payload.message.content or "").strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Empty content")
    reply = rag.generate_direct(user_text)
    return make_assistant_message(reply)

# =========================================================
# 2) 走 RAG：POST /api/chat/messages/rag
#    支持两种请求：
#    a. multipart/form-data：files[] + content
#    b. application/json：   { "message": { "content": "..." } }
#    返回：助手回答 + 检索命中（命中/分数/内容/分析）
# =========================================================
@app.post("/api/chat/messages/rag")
async def rag_chat(request: Request):
    attachments: List[dict] = []
    question: str = ""

    ctype = (request.headers.get("content-type") or "").lower()
    is_multipart = "multipart/form-data" in ctype

    if is_multipart:
        form = await request.form()
        # 文本
        question = (form.get("content") or "").strip()
        # 文件
        files = form.getlist("files")
        for f in files:
            if not isinstance(f, UploadFile) or not f.filename:
                continue
            dest = UPLOAD_DIR / f.filename
            with dest.open("wb") as w:
                w.write(await f.read())
            raw = dest.read_bytes()
            text = None
            if dest.suffix.lower() == ".txt":
                for enc in ["utf-8", "gbk"]:
                    try:
                        text = raw.decode(enc)
                        break
                    except Exception:
                        continue
            if text is None:
                # 尽量不阻塞：让解析保持宽松（复杂格式可后续扩展成专门解析器）
                try:
                    text = raw.decode("utf-8", errors="ignore")
                except Exception:
                    text = ""
            rag.add_document(f.filename, text)
            attachments.append({
                "name": f.filename,
                "mime": mimetypes.guess_type(f.filename)[0] or "application/octet-stream",
                "size": dest.stat().st_size,
            })
    else:
        # JSON 模式
        try:
            body = await request.json()
            question = (body or {}).get("message", {}).get("content", "") or ""
            question = question.strip()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")

    if not question:
        raise HTTPException(status_code=400, detail="Empty content")

    # 检索（返回命中 + 分数 + 内容 + 分析）
    hits = rag.retrieve(question, k=3, min_score=0.1)

    # 用命中片段生成回答（带上下文）
    answer = rag.generate_with_context(question, hits)

    # 返回：助手回答 + 命中详情，便于前端检查“是否与文件有关”
    return {
        **make_assistant_message(answer, attachments),
        "retrieval": {"hits": hits, "stats": rag.stats()},
    }
