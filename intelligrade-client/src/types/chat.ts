// src/types/chat.ts
export type Role = "user" | "assistant";

export interface ChatAttachment {
  name: string;
  mime: string;
  size: number;          // bytes
  url?: string;          // Backend returned publicly accessible URL (or frontend blob: preview)
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: string;     // ISO timestamp
  attachments?: ChatAttachment[];  // Message attachments
}

