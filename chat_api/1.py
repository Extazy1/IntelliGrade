# main.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True
)

class TextMessage(BaseModel):
    role: str
    content: str

@app.get("/")
def health():
    return {"ok": True}

# 纯文本消息
@app.post("/api/chat/messages")
def create_message(message: TextMessage):
    # 这里你可以接入模型或转发
    return {"echo": message}

# 文本 + 多文件上传（前端 multipart/form-data）
@app.post("/api/chat/messages/upload")
async def create_message_with_files(
    role: str = Form(...),
    content: str = Form(""),
    files: Optional[List[UploadFile]] = File(None)
):
    file_infos = []
    if files:
        for f in files:
            file_infos.append({"filename": f.filename, "content_type": f.content_type})
    return {"role": role, "content": content, "files": file_infos}
