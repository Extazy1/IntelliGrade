// /src/lib/chatboxApi.ts
// Adapts two routes:
//  - POST /api/chat/messages/direct  (JSON, direct connection without RAG)
//  - POST /api/chat/messages/rag     (multipart, uses RAG, supports file upload)

import type { ChatMessage, ChatAttachment, Role } from "@/types/chat";

// Use proxy path to avoid CORS issues
// In production, this will be proxied by Next.js rewrites
const API_HOST = process.env.NEXT_PUBLIC_CHAT_API_HOST || "";

type SendTextArgs = {
  sessionId?: string; // Optional, backend will ignore without error
  content: string;
};

type SendFilesArgs = {
  sessionId?: string;
  content: string; // Question text
  files: File[];   // Multiple files
};

interface BackendResponse {
  assistantMessage?: {
    id?: string;
    role?: string;
    content?: string;
    createdAt?: string;
    attachments?: Array<{
      name?: string;
      mime?: string;
      size?: number;
      url?: string;
    }>;
  };
}

function toChatMessage(data: BackendResponse): ChatMessage {
  // Backend returns: { assistantMessage: { id, role, content, createdAt, attachments? } ... }
  const am = data?.assistantMessage ?? {};
  const atts: ChatAttachment[] = (am.attachments || []).map((a) => ({
    name: a?.name || "",
    mime: a?.mime || "",
    size: a?.size || 0,
    // RAG route attachments may not have url, handle gracefully
    url: a?.url,
  }));

  // Ensure role is exactly "user" or "assistant"
  const role: Role = (am.role === "user" || am.role === "assistant") ? am.role : "assistant";

  const msg: ChatMessage = {
    id: am.id || "asst_" + Date.now(),
    role: role,
    content: am.content || "",
    createdAt: am.createdAt || new Date().toISOString(),
    attachments: atts.length > 0 ? atts : undefined,
  };
  return msg;
}

/** Pure text: Direct model connection (no RAG) */
export async function sendChatMessage(args: SendTextArgs): Promise<ChatMessage> {
  const res = await fetch(`${API_HOST}/api/chat/messages/direct`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Backend expects { message: { content } }, sessionId optional
    body: JSON.stringify({
      sessionId: args.sessionId,
      message: { role: "user", content: args.content },
    }),
  });

  if (!res.ok) {
    const text = await safeText(res);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? "- " + text : ""}`);
  }
  const data = await res.json();
  return toChatMessage(data);
}

/** File + text: Uses RAG (upload files + question text) */
export async function sendChatMessageWithFiles(args: SendFilesArgs): Promise<ChatMessage> {
  const fd = new FormData();
  fd.append("content", args.content || "");
  if (args.sessionId) fd.append("sessionId", args.sessionId);
  for (const f of args.files) {
    // Key point: field name must be "files"
    fd.append("files", f, f.name);
  }

  const res = await fetch(`${API_HOST}/api/chat/messages/rag`, {
    method: "POST",
    body: fd, // Don't manually set Content-Type, browser will automatically add multipart boundary
  });

  if (!res.ok) {
    const text = await safeText(res);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? "- " + text : ""}`);
  }

  const data = await res.json();

  // If you want to "debug RAG hit details" on frontend, extract data.retrieval.hits
  // For example: return { ...toChatMessage(data), debug: data.retrieval?.hits }
  return toChatMessage(data);
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

