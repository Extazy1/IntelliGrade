# -*- coding: utf-8 -*-
import os
import re
import json
import hashlib
import sqlite3
from typing import List, Dict, Any, Tuple

import requests

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
except Exception:
    TfidfVectorizer = None
    cosine_similarity = None

import threading
from pathlib import Path

# 目录
DB_DIR = Path("chroma_db")
DB_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "rag_database.db"

# 模型配置（默认 Ollama）
DEFAULT_LLM_BASE = os.environ.get("LLM_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.environ.get("LLM_MODEL", "llama3.1:8b")


def _tokenize_cn_en(text: str) -> List[str]:
    """
    极简中英混合 tokenizer:
    - 连续英文/数字（长度>=2）整体作为 token
    - 汉字逐字
    """
    text = re.sub(r"[\r\n\t]", " ", text or "")
    en_nums = re.findall(r"[A-Za-z0-9_\-\.]{2,}", text)
    placeholder = "\uFFFF"
    tmp = text
    for i, seg in enumerate(en_nums):
        tmp = tmp.replace(seg, f"{placeholder}{i}{placeholder}", 1)
    toks = [c for c in tmp if '\u4e00' <= c <= '\u9fff']
    toks += [seg.lower() for seg in en_nums]
    return [t.strip().lower() for t in toks if t.strip()]


class RAGSystem:
    def __init__(self):
        self.conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                source TEXT,
                content_hash TEXT UNIQUE
            )
            """
        )
        self.conn.commit()
        self.vectorizer = None
        self.matrix = None
        self._rebuild_lock = threading.Lock()
        self._load_and_vectorize()

    # ---------- 文本分块 ----------
    def _split_into_chunks(self, text: str, max_len: int = 600) -> List[str]:
        paras = [p.strip() for p in re.split(r"\n\s*\n", text or "") if p.strip()]
        chunks = []
        for p in paras:
            if len(p) <= max_len:
                chunks.append(p)
            else:
                sents = re.split(r"(?<=[。！？.!?])\s+", p)
                buf, cur = [], 0
                for s in sents:
                    if cur + len(s) + 1 > max_len:
                        if buf:
                            chunks.append(" ".join(buf).strip())
                        buf, cur = [s], len(s)
                    else:
                        buf.append(s)
                        cur += len(s) + 1
                if buf:
                    chunks.append(" ".join(buf).strip())
        return [c if c.endswith(".") else c + "." for c in chunks]

    # ---------- 入库（按 chunk 去重） ----------
    def add_document(self, filename: str, content: str) -> int:
        cur = self.conn.cursor()
        cnt = 0
        for chunk in self._split_into_chunks(content):
            h = hashlib.md5(chunk.encode("utf-8")).hexdigest()
            try:
                cur.execute(
                    "INSERT INTO chunks(content, source, content_hash) VALUES(?,?,?)",
                    (chunk, filename, h),
                )
                cnt += 1
            except sqlite3.IntegrityError:
                pass
        self.conn.commit()
        if cnt:
            self._rebuild_vectors_async()
        return cnt

    # ---------- 构建向量 ----------
    def _load_and_vectorize(self):
        cur = self.conn.cursor()
        cur.execute("SELECT content FROM chunks")
        rows = [r[0] for r in cur.fetchall()]
        if not rows or TfidfVectorizer is None:
            self.vectorizer, self.matrix = None, None
            return
        try:
            self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=1000)
            self.matrix = self.vectorizer.fit_transform(rows)
        except Exception:
            # 降级
            self.vectorizer = TfidfVectorizer(ngram_range=(1, 1), max_features=500)
            if len(rows) == 1:
                rows = rows + rows
            self.matrix = self.vectorizer.fit_transform(rows)

    def _rebuild_vectors_async(self):
        def _job():
            with self._rebuild_lock:
                self._load_and_vectorize()

        threading.Thread(target=_job, daemon=True).start()

    # ---------- 只做检索（返回 命中+分数+内容+分析；不调用模型） ----------
    def retrieve(self, query: str, k: int = 3, min_score: float = 0.1) -> List[Dict[str, Any]]:
        cur = self.conn.cursor()
        cur.execute("SELECT id, content, source FROM chunks")
        rows = cur.fetchall()
        if not rows or self.vectorizer is None or self.matrix is None or TfidfVectorizer is None:
            return []

        qv = self.vectorizer.transform([query])
        sims = cosine_similarity(qv, self.matrix)[0]
        ranked = sorted(list(enumerate(sims)), key=lambda x: x[1], reverse=True)

        q_tokens = set(_tokenize_cn_en(query))
        hits: List[Dict[str, Any]] = []
        for idx, score in ranked[:k * 5]:
            if score < min_score:
                continue
            row_id, content, source = rows[idx]

            c_tokens = set(_tokenize_cn_en(content))
            inter = q_tokens & c_tokens
            union = q_tokens | c_tokens if (q_tokens or c_tokens) else set()
            jacc = (len(inter) / len(union)) if union else 0.0
            cov_q = (len(inter) / len(q_tokens)) if q_tokens else 0.0

            sents = re.split(r"(?<=[。！？.!?])\s+", content)
            sent_scores: List[Tuple[int, str]] = []
            for s in sents:
                st = set(_tokenize_cn_en(s))
                sent_scores.append((len(st & q_tokens), s))
            sent_scores.sort(key=lambda x: x[0], reverse=True)
            highlights = [s for n, s in sent_scores[:2] if s.strip()]

            hits.append(
                {
                    "id": row_id,
                    "score": float(score),
                    "content": content,
                    "source": source,
                    "analysis": {
                        "overlap_terms": sorted(list(inter))[:20],
                        "query_coverage": round(cov_q, 4),
                        "jaccard": round(jacc, 4),
                        "highlights": highlights,
                        "source": source,
                    },
                }
            )
            if len(hits) >= k:
                break
        return hits

    # ---------- 直连模型（不带上下文） ----------
    def generate_direct(self, question: str) -> str:
        sys_inst = "你是一个有帮助的助手。"
        prompt = f"{sys_inst}\n\n用户问题：{question}\n请直接回答。"
        return self._call_llm(prompt)

    # ---------- 带上下文生成（把检索片段拼进提示词） ----------
    def generate_with_context(self, question: str, hits: List[Dict[str, Any]]) -> str:
        ctx_lines = []
        for i, h in enumerate(hits, 1):
            ctx_lines.append(f"[片段{i}] 来源: {h['source']}\n{h['content']}")
        ctx = "\n\n".join(ctx_lines) if ctx_lines else "(无命中片段)"

        sys_inst = (
            "你是一个检索增强助手。优先基于提供的片段回答；"
            "如片段中没有关键信息，再结合常识补充，并明确说明。"
        )
        prompt = (
            f"{sys_inst}\n\n已检索到的相关片段：\n{ctx}\n\n"
            f"用户问题：{question}\n请给出清晰、分点的回答，并在末尾用【来源】列出使用到的片段编号。"
        )
        return self._call_llm(prompt)

    # ---------- 调用底层 LLM ----------
    def _call_llm(self, prompt: str, temperature: float = 0.3, num_predict: int = 1024) -> str:
        url = f"{DEFAULT_LLM_BASE}/api/generate"
        payload = {
            "model": DEFAULT_MODEL,
            "prompt": prompt,
            "temperature": temperature,
            "num_predict": num_predict,
        }
        try:
            r = requests.post(url, json=payload, timeout=60)
            r.raise_for_status()
            # 非流式
            try:
                data = r.json()
                if isinstance(data, dict) and "response" in data:
                    return data["response"]
            except Exception:
                pass
            # 流式（逐行 JSON）
            text = []
            for line in r.iter_lines(decode_unicode=True):
                if not line:
                    continue
                try:
                    piece = json.loads(line)
                    text.append(piece.get("response", ""))
                except Exception:
                    pass
            return "".join(text) if text else ""
        except Exception as e:
            return f"[LLM 连接失败] {e}"

    # ---------- 统计 ----------
    def stats(self) -> Dict[str, Any]:
        cur = self.conn.cursor()
        cur.execute("SELECT COUNT(*), COUNT(DISTINCT source) FROM chunks")
        total, sources = cur.fetchone()
        ready = self.vectorizer is not None and self.matrix is not None
        return {"chunks": total, "sources": sources, "vector_ready": ready}


rag = RAGSystem()
