"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { sendChatMessage, sendChatMessageWithFiles } from "@/lib/chatboxApi";
import type { ChatMessage, ChatAttachment } from "@/types/chat";

/** ChatboxContent - Enhanced: Supports file upload (multiple files) */
export default function ChatboxContent({ sessionId: propSessionId }: { sessionId?: string }) {
  const [sessionId] = useState<string>(propSessionId || "sess_default");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Pending files to be sent
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const endRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => (!!input.trim() || pendingFiles.length > 0) && !sending, [input, pendingFiles, sending]);

  useEffect(() => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, [messages]);

  const openPicker = () => fileInputRef.current?.click();

  const onFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setPendingFiles((prev) => [...prev, ...arr]);
    // Clear input value to allow selecting the same file again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePending = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Send (text + attachments)
  const onSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSend) return;

    const text = input.trim();
    const files = pendingFiles.slice();

    // 1) Optimistically render "user message + selected file preview"
    const userMsg: ChatMessage = {
      id: "u_" + Date.now(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      attachments: files.map((f) => ({
        name: f.name,
        mime: f.type,
        size: f.size,
        // For preview only (before sending): give blob URL for images; others don't need it
        url: f.type?.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      })),
    };
    const asstId = "a_" + Date.now();
    const asstPlaceholder: ChatMessage = {
      id: asstId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, asstPlaceholder]);
    setInput("");
    setPendingFiles([]);
    setSending(true);

    // 2) Call API (with/without files)
    try {
      let reply: ChatMessage;
      if (files.length > 0) {
        reply = await sendChatMessageWithFiles({ sessionId, content: text, files });
      } else {
        reply = await sendChatMessage({ sessionId, content: text });
      }
      setMessages((prev) => prev.map((m) => (m.id === asstId ? reply : m)));
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstId ? { ...m, content: `[Send failed] ${err?.message || String(err)}` } : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  // Enter to send / Shift+Enter for new line
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#f7f7f8]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Chat</h2>
            <p className="text-[11px] text-gray-500">Session: {sessionId}</p>
          </div>
          <div className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600">
            Assistant
          </div>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-3 md:px-0 py-4">
          {messages.length === 0 ? (
            <EmptyWelcome onPick={(text) => setInput(text)} />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <MessageRow key={m.id} msg={m} sending={sending} />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Bottom input bar + upload */}
      <div className="sticky bottom-0 border-t bg-white px-3 py-3">
        <div className="mx-auto w-full max-w-3xl">
          {/* Pending attachments preview bar */}
          {pendingFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingFiles.map((f, i) =>
                f.type.startsWith("image/") ? (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePending(i)}
                      className="absolute -right-2 -top-2 rounded-full bg-black/80 px-1.5 py-0.5 text-[10px] text-white"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div key={i} className="group relative flex items-center gap-2 rounded-lg border px-2 py-1 text-xs">
                    <span className="inline-block rounded bg-gray-100 px-1 py-0.5">{fileIcon(f.type)}</span>
                    <span className="max-w-[180px] truncate" title={f.name}>{f.name}</span>
                    <span className="text-gray-500">{formatSize(f.size)}</span>
                    <button
                      type="button"
                      onClick={() => removePending(i)}
                      className="ml-1 rounded bg-gray-100 px-1 text-[10px] opacity-70 hover:opacity-100"
                      title="Remove"
                    >
                      Remove
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          <form onSubmit={onSend} className="rounded-2xl border bg-white p-2 shadow-sm">
            <div className="flex items-end gap-2">
              {/* Upload button */}
              <button
                type="button"
                onClick={openPicker}
                className="h-10 shrink-0 rounded-lg border px-3 text-sm hover:bg-gray-50"
                title="Upload files (multiple)"
              >
                📎 Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => onFilesSelected(e.target.files)}
                className="hidden"
              />

              {/* Text input */}
              <textarea
                className="max-h-40 w-full resize-y rounded-2xl px-3 py-2 text-sm outline-none placeholder:text-gray-400"
                placeholder="Enter message, or click 📎 to select files… (Enter to send / Shift+Enter for new line)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
              />

              {/* Send */}
              <button
                type="submit"
                disabled={!canSend}
                className={`h-10 shrink-0 rounded-lg px-3 text-sm font-medium text-white transition
                  ${canSend ? "bg-[#2563eb] hover:opacity-90" : "bg-gray-300 cursor-not-allowed"}`}
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between px-1 text-[11px] text-gray-400">
              <span>Tip: Shift + Enter for new line</span>
              <span>Supports multiple file uploads (images, PDF, Office, text, etc.)</span>
            </div>
          </form>

          <div className="py-2 text-center text-[10px] text-gray-400">
            Please ensure you have permission for uploaded content and do not include sensitive information.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Message Row & Rendering ------------------------- */

function MessageRow({ msg, sending }: { msg: ChatMessage; sending: boolean }) {
  const isUser = msg.role === "user";
  const isEmptyAssistant = msg.role === "assistant" && !msg.content?.trim() && (!msg.attachments || msg.attachments.length === 0);

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[95%] items-start gap-3 md:max-w-[85%]">
        {!isUser && (
          <div className="mt-1 flex h-7 w-7 shrink-0 select-none items-center justify-center rounded bg-gray-200">
            <span className="text-[13px]">🤖</span>
          </div>
        )}

        <div
          className={[
            "min-w-[60px] whitespace-pre-wrap rounded-2xl px-4 py-2 text-[13px] leading-relaxed shadow-sm",
            isUser ? "bg-[#2563eb] text-white shadow-blue-100" : "bg-[#f1f5f9] text-[#111827]",
          ].join(" ")}
        >
          {isEmptyAssistant ? (
            <DotLoader />
          ) : (
            <>
              {msg.content && <RichText text={msg.content} />}
              {msg.attachments && msg.attachments.length > 0 && (
                <AttachmentsGrid attachments={msg.attachments} dark={isUser} />
              )}
            </>
          )}
        </div>

        {isUser && (
          <div className="mt-1 flex h-7 w-7 shrink-0 select-none items-center justify-center rounded bg-[#1f2937] text-white">
            <span className="text-[13px]">🧑</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* Rich text (only handles code fence blocks) */
function RichText({ text }: { text: string }) {
  const parts = splitByCodeFence(text);
  return (
    <div className="space-y-3">
      {parts.map((p, i) =>
        p.type === "code" ? (
          <CodeBlock key={i} code={p.content} lang={p.lang} />
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {p.content}
          </p>
        )
      )}
    </div>
  );
}

type CodePart =
  | { type: "text"; content: string }
  | { type: "code"; content: string; lang?: string };

function splitByCodeFence(input: string): CodePart[] {
  const fence = /```(\w+)?\n([\s\S]*?)```/g;
  const out: CodePart[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(input))) {
    if (m.index > lastIndex) out.push({ type: "text", content: input.slice(lastIndex, m.index) });
    out.push({ type: "code", lang: m[1], content: m[2] });
    lastIndex = fence.lastIndex;
  }
  if (lastIndex < input.length) out.push({ type: "text", content: input.slice(lastIndex) });
  return out.length ? out : [{ type: "text", content: input }];
}

/* Code block + copy */
function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b bg-gray-50 px-3 py-1.5">
        <span className="text-[11px] uppercase text-gray-500">{lang || "code"}</span>
        <button
          onClick={onCopy}
          className="rounded border px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-100"
          title="Copy code"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[12px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* Attachment rendering */
function AttachmentsGrid({ attachments, dark }: { attachments: ChatAttachment[]; dark?: boolean }) {
  return (
    <div className={`mt-2 grid grid-cols-2 gap-2 ${attachments.length >= 3 ? "md:grid-cols-3" : ""}`}>
      {attachments.map((a, i) =>
        a.mime?.startsWith("image/") && a.url ? (
          <a key={i} href={a.url} target="_blank" className="block">
            <img
              src={a.url}
              alt={a.name}
              className={`h-28 w-full rounded-lg object-cover ring-1 ${dark ? "ring-white/20" : "ring-gray-200"}`}
            />
            <div className={`mt-1 truncate text-[11px] ${dark ? "text-white/80" : "text-gray-600"}`} title={a.name}>
              {a.name}
            </div>
          </a>
        ) : (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-xs ${dark ? "border-white/20 text-white/90" : ""}`}
            title={a.name}
          >
            <span className="rounded bg-gray-100 px-1 py-0.5">{fileIcon(a.mime)}</span>
            <span className="truncate">{a.name}</span>
            <span className="text-gray-500">{formatSize(a.size)}</span>
          </div>
        )
      )}
    </div>
  );
}

/* Utility components */
function DotLoader() {
  return (
    <span className="inline-flex items-center gap-1">
      <i className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-80" />
      <i className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-60 [animation-delay:120ms]" />
      <i className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-40 [animation-delay:240ms]" />
    </span>
  );
}

function EmptyWelcome({ onPick }: { onPick: (t: string) => void }) {
  const examples = [
    "Please summarize the key points of the PDF I&apos;m about to upload",
    "I&apos;ll upload several images, please extract text and compare",
    "Upload a CSV, help me do basic analysis and generate conclusions",
    "Upload a PPT, help me write key points for presentation",
  ];
  return (
    <div className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border bg-white p-5 text-center shadow-sm">
      <div className="text-xl font-semibold">What would you like to discuss today?</div>
      <div className="mt-2 text-sm text-gray-500">Supports uploading images/documents/spreadsheets and other files.</div>
      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        {examples.map((e) => (
          <button
            key={e}
            onClick={() => onPick(e)}
            className="rounded-xl border px-3 py-2 text-left text-[13px] hover:bg-gray-50"
            title="Click to fill in input box"
          >
            {e}
          </button>
        ))}
      </div>
      <div className="mt-4 text-[11px] text-gray-400">Please do not upload restricted or sensitive content.</div>
    </div>
  );
}

function fileIcon(mime?: string) {
  if (!mime) return "📄";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📕";
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return "📊";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "📽️";
  if (mime.includes("word") || mime.includes("msword")) return "📝";
  if (mime.startsWith("text/")) return "📃";
  return "📎";
}
function formatSize(n: number) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)}MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)}GB`;
}

