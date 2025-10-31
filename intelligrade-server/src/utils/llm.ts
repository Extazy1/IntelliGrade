import "dotenv/config";
import fs from "node:fs";
import OpenAI from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { HEADER_PROMPT, MCQ_PROMPT, SUBJECTIVE_PROMPT } from "./prompt";
import { zodResponseFormat } from "openai/helpers/zod";
import { Header, HeaderSchema, MCQResult, MCQSchema, SubjectiveInput, SubjectiveResult, SubjectiveSchema } from "./schema";
import { imageToBase64 } from "./tools";

export class LLMRequestError extends Error {
    public readonly meta: Record<string, unknown>;

    constructor(message: string, meta: Record<string, unknown> = {}, cause?: unknown) {
        super(message);
        this.name = "LLMRequestError";
        this.meta = meta;
        if (cause !== undefined) {
            (this as unknown as { cause?: unknown }).cause = cause;
        }
    }
}

const llmLogger = {
    info(message: string, meta?: Record<string, unknown>) {
        if (typeof strapi !== "undefined" && strapi?.log) {
            strapi.log.info(meta ? `${message} ${JSON.stringify(meta)}` : message);
        } else {
            console.info(message, meta ?? "");
        }
    },
    error(message: string, error?: unknown, meta?: Record<string, unknown>) {
        if (typeof strapi !== "undefined" && strapi?.log) {
            strapi.log.error(meta ? `${message} ${JSON.stringify(meta)}` : message, error instanceof Error ? error : undefined);
        } else {
            console.error(message, meta ?? "", error);
        }
    }
};

type RecognizeHeaderOptions = {
    scheduleId?: string;
    headerIndex?: number;
    totalHeaders?: number;
};

function getRequiredEnvVar(key: string): string {
    const value = process.env[key]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

const optionalEnv = (key: string): string | undefined => process.env[key]?.trim() || undefined;

const isTruthy = (value?: string): boolean => {
    if (!value) {
        return false;
    }
    switch (value.toLowerCase()) {
        case "1":
        case "true":
        case "yes":
        case "on":
            return true;
        default:
            return false;
    }
};

const isLLMDebugEnabled = (): boolean => isTruthy(optionalEnv("LLM_DEBUG"));

let gptClient: OpenAI | null = null;
let qwenClient: OpenAI | null = null;

function getGptClient(): OpenAI {
    if (!gptClient) {
        gptClient = new OpenAI({
            apiKey: getRequiredEnvVar("OPENAI_API_KEY"),
            baseURL: optionalEnv("OPENAI_BASE_URL"),
        });
    }
    return gptClient;
}

function getQwenClient(): OpenAI {
    if (!qwenClient) {
        qwenClient = new OpenAI({
            apiKey: getRequiredEnvVar("QWEN_API_KEY"),
            baseURL: optionalEnv("QWEN_BASE_URL"),
        });
    }
    return qwenClient;
}

type MatchingResolution = {
    provider: "openai" | "qwen";
    client: OpenAI;
    model: string;
    modelSource: string;
};

function resolveMatchingModel(provider: "openai" | "qwen", rawModel?: string): { model: string; source: string } {
    const trimmed = rawModel?.trim();

    if (provider === "qwen") {
        if (trimmed && /^(qwen|dashscope)/i.test(trimmed)) {
            return { model: trimmed, source: "MATCHING_MODEL_NAME" };
        }

        if (trimmed) {
            llmLogger.info("[llm] ignoring non-Qwen matching model for Qwen provider", { model: trimmed });
        }

        const qwenSpecific = optionalEnv("QWEN_MATCHING_MODEL_NAME");
        if (qwenSpecific) {
            return { model: qwenSpecific, source: "QWEN_MATCHING_MODEL_NAME" };
        }

        return { model: "qwen-vl-max-2025-01-25", source: "default-qwen" };
    }

    if (trimmed && !/^qwen/i.test(trimmed)) {
        return { model: trimmed, source: "MATCHING_MODEL_NAME" };
    }

    const openaiSpecific = optionalEnv("OPENAI_MATCHING_MODEL_NAME");
    if (openaiSpecific) {
        return { model: openaiSpecific, source: "OPENAI_MATCHING_MODEL_NAME" };
    }

    return { model: "gpt-4o-mini", source: "default-openai" };
}

function resolveMatchingClient(): MatchingResolution {
    const providerHint = optionalEnv("MATCHING_PROVIDER")
        ?? optionalEnv("MATCHING_CLIENT")
        ?? optionalEnv("MATCHING_VENDOR");
    const normalizedHint = providerHint?.toLowerCase();
    const rawModel = optionalEnv("MATCHING_MODEL_NAME");
    const hasQwenCredentials = Boolean(optionalEnv("QWEN_API_KEY"));

    if (normalizedHint) {
        if (["qwen", "dashscope", "ali", "aliyun"].includes(normalizedHint)) {
            const resolved = resolveMatchingModel("qwen", rawModel);
            return { provider: "qwen", client: getQwenClient(), model: resolved.model, modelSource: resolved.source };
        }
        if (["openai", "azure-openai", "azure"].includes(normalizedHint)) {
            const resolved = resolveMatchingModel("openai", rawModel);
            return { provider: "openai", client: getGptClient(), model: resolved.model, modelSource: resolved.source };
        }
    }

    if (hasQwenCredentials) {
        const resolved = resolveMatchingModel("qwen", rawModel);
        return { provider: "qwen", client: getQwenClient(), model: resolved.model, modelSource: resolved.source };
    }

    if ((rawModel?.toLowerCase() ?? "").includes("qwen") || (rawModel?.toLowerCase() ?? "").includes("dashscope")) {
        const resolved = resolveMatchingModel("qwen", rawModel);
        return { provider: "qwen", client: getQwenClient(), model: resolved.model, modelSource: resolved.source };
    }

    const resolved = resolveMatchingModel("openai", rawModel);
    return { provider: "openai", client: getGptClient(), model: resolved.model, modelSource: resolved.source };
}

export async function recognizeHeader(imagePath: string, options: RecognizeHeaderOptions = {}): Promise<Header> {
    const resolution = resolveMatchingClient();
    const { client, provider, model, modelSource } = resolution;
    const label = typeof options.headerIndex === "number" && typeof options.totalHeaders === "number"
        ? `${options.headerIndex + 1}/${options.totalHeaders}`
        : `${(options.headerIndex ?? 0) + 1}`;

    if (!fs.existsSync(imagePath)) {
        const meta = {
            scheduleId: options.scheduleId,
            imagePath,
            provider,
            model,
            modelSource,
            header: label,
        };
        llmLogger.error("[llm] header image file missing", undefined, meta);
        throw new LLMRequestError("Header image file not found", meta);
    }

    const { size: imageSize } = fs.statSync(imagePath);

    llmLogger.info("[llm] sending header image for recognition", {
        scheduleId: options.scheduleId,
        imagePath,
        model,
        modelSource,
        header: label,
        provider,
        imageBytes: imageSize,
    });

    try {
        const base64Image = imageToBase64(imagePath);

        if (isLLMDebugEnabled()) {
            llmLogger.info("[llm] prepared header image payload", {
                scheduleId: options.scheduleId,
                header: label,
                provider,
                model,
                base64Length: base64Image.length,
            });
        }

        const openaiContent: ChatCompletionCreateParamsNonStreaming["messages"][number]["content"] = [
            {
                type: "image_url",
                image_url: {
                    url: `data:image/png;base64,${base64Image}`,
                },
            },
            {
                type: "text",
                text: HEADER_PROMPT,
            },
        ];

        const qwenContent = [
            {
                type: "text",
                text: HEADER_PROMPT,
            },
            {
                type: "image_url",
                image_url: {
                    url: `data:image/png;base64,${base64Image}`,
                },
            },
        ];

        const request: ChatCompletionCreateParamsNonStreaming = {
            model,
            messages: [] as unknown as ChatCompletionCreateParamsNonStreaming["messages"],
            stream: false,
        };

        const message = provider === "openai"
            ? { role: "user", content: openaiContent }
            : { role: "user", content: qwenContent };

        request.messages = [message] as unknown as ChatCompletionCreateParamsNonStreaming["messages"];

        if (provider === "openai") {
            request.response_format = zodResponseFormat(HeaderSchema, "header");
        }

        const response = await client.chat.completions.create(request);

        const rawContent = response.choices[0]?.message?.content;
        let content: string | undefined;
        if (typeof rawContent === "string") {
            content = rawContent;
        } else if (Array.isArray(rawContent)) {
            content = (rawContent as Array<Record<string, unknown> | string>).map((part) => {
                if (typeof part === "string") {
                    return part;
                }
                if (part && typeof part === "object" && "text" in part && typeof (part as { text?: unknown }).text === "string") {
                    return (part as { text: string }).text;
                }
                return "";
            }).join("");
        } else if (rawContent && typeof rawContent === "object" && "text" in rawContent && typeof (rawContent as { text?: unknown }).text === "string") {
            content = (rawContent as { text: string }).text;
        }
        if (isLLMDebugEnabled()) {
            llmLogger.info("[llm] header recognition raw response", {
                scheduleId: options.scheduleId,
                header: label,
                provider,
                model,
                modelSource,
                choiceIndex: 0,
                finishReason: response.choices[0]?.finish_reason,
            });
        }

        llmLogger.info("[llm] header recognition succeeded", {
            scheduleId: options.scheduleId,
            header: label,
            provider,
            model,
        });

        try {
            // Clean markdown code blocks from response (Qwen sometimes wraps JSON in ```json ... ```)
            let cleanedContent = content?.trim() || "";
            if (cleanedContent.startsWith("```")) {
                // Remove opening ```json or ``` and closing ```
                cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
            }
            
            const parsedContent: unknown = cleanedContent.length > 0
                ? JSON.parse(cleanedContent)
                : {};
            
            // Handle both snake_case (student_id) and camelCase (studentId) formats
            if (parsedContent && typeof parsedContent === 'object') {
                const obj = parsedContent as Record<string, unknown>;
                if ('student_id' in obj && !('studentId' in obj)) {
                    obj.studentId = obj.student_id;
                }
            }
            
            const headerData = HeaderSchema.parse(parsedContent);
            return {
                name: headerData.name,
                studentId: headerData.studentId,
            } satisfies Header;
        } catch (parseError) {
            llmLogger.error("[llm] failed to parse header recognition response", parseError, {
                scheduleId: options.scheduleId,
                header: label,
                provider,
                model,
                preview: content?.slice(0, 200)
            });
            return {
                name: 'Unknown',
                studentId: 'Unknown'
            };
        }
    } catch (error) {
        const message = "Failed to send header image to the matching model";
        const meta: Record<string, unknown> = {
            scheduleId: options.scheduleId,
            header: label,
            model,
            provider,
            modelSource,
        };

        if (error && typeof error === "object") {
            const anyErr = error as Record<string, unknown>;
            if (typeof anyErr["status"] !== "undefined") {
                meta.status = anyErr["status"];
            }
            if (typeof anyErr["code"] !== "undefined") {
                meta.code = anyErr["code"];
            }
            if (typeof anyErr["type"] === "string") {
                meta.type = anyErr["type"];
            }
            if ("error" in anyErr && anyErr.error && typeof anyErr.error === "object") {
                const errorObj = anyErr.error as Record<string, unknown>;
                if (typeof errorObj.message === "string") {
                    meta.providerMessage = errorObj.message;
                }
                if (typeof errorObj.type === "string") {
                    meta.providerType = errorObj.type;
                }
            }
            if ("response" in anyErr && anyErr.response && typeof anyErr.response === "object") {
                const responseObj = anyErr.response as Record<string, unknown>;
                if (typeof responseObj["status"] !== "undefined") {
                    meta.httpStatus = responseObj["status"];
                }
                if (typeof responseObj["data"] !== "undefined") {
                    const dataVal = responseObj["data"];
                    if (typeof dataVal === "string") {
                        meta.httpResponsePreview = dataVal.slice(0, 500);
                    } else if (dataVal && typeof dataVal === "object") {
                        meta.httpResponseData = JSON.stringify(dataVal);
                    }
                }
            }
        }

        llmLogger.error("[llm] header recognition failed", error, meta);
        throw new LLMRequestError(message, meta, error);
    }
}

export async function recognizeMCQ(imagePath: string): Promise<MCQResult> {
    console.log('MODEL NAME', process.env.OBJECTIVE_MODEL_NAME);
    const response = await getQwenClient().chat.completions.create({
        model: process.env.OBJECTIVE_MODEL_NAME,
        messages: [{
            role: "user",
            content: [
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/png;base64,${imageToBase64(imagePath)}`,
                    },
                },
                {
                    type: "text",
                    text: MCQ_PROMPT,
                },
            ]
        }],
        response_format: zodResponseFormat(MCQSchema, 'answer')
    });

    try {
        const answer = JSON.parse(response.choices[0].message.content!);
        return answer as MCQResult;
    } catch (error) {
        return {
            answer: ['Unknown']
        };
    }
}

export async function askSubjective(question: SubjectiveInput): Promise<SubjectiveResult> {
    console.log('LLM SUBJECTIVE START');
    
    // Determine provider and model (support both GPT and Qwen)
    const providerHint = optionalEnv("SUBJECTIVE_PROVIDER") ?? optionalEnv("MATCHING_PROVIDER");
    const rawModel = optionalEnv("SUBJECTIVE_MODEL_NAME") ?? "openai/gpt-4o-mini";
    const normalizedHint = providerHint?.toLowerCase();
    const hasQwenCredentials = Boolean(optionalEnv("QWEN_API_KEY"));
    
    let provider: "openai" | "qwen" = "openai";
    let client: OpenAI;
    let model: string = rawModel;
    
    // Determine provider based on hints and credentials
    if (normalizedHint && ["qwen", "dashscope", "ali", "aliyun"].includes(normalizedHint)) {
        provider = "qwen";
    } else if (rawModel.toLowerCase().includes("qwen") || rawModel.toLowerCase().includes("dashscope")) {
        provider = "qwen";
    } else if (hasQwenCredentials && !normalizedHint) {
        // If no explicit provider but has Qwen credentials, prefer Qwen
        provider = "qwen";
        model = optionalEnv("QWEN_SUBJECTIVE_MODEL_NAME") ?? "qwen-vl-max-2025-01-25";
    }
    
    client = provider === "qwen" ? getQwenClient() : getGptClient();
    
    console.log('MODEL NAME', model);
    console.log('PROVIDER', provider);
    console.log(question);
    
    const base64Image = imageToBase64(question.imageUrl);
    
    // Build prompt with question context
    const promptWithContext = `${SUBJECTIVE_PROMPT}
    
Question: ${question.question}
Reference Answer: ${question.answer}
Total Score: ${question.score}`;
    
    const content: ChatCompletionCreateParamsNonStreaming["messages"][number]["content"] = [
        {
            type: "text",
            text: promptWithContext,
        },
        {
            type: "image_url",
            image_url: {
                url: `data:image/png;base64,${base64Image}`,
            },
        },
    ];
    
    const request: ChatCompletionCreateParamsNonStreaming = {
        model,
        messages: [{ role: "user", content }],
        stream: false,
    };
    
    // Only add response_format for OpenAI (Qwen doesn't support it consistently)
    if (provider === "openai") {
        request.response_format = zodResponseFormat(SubjectiveSchema, 'answer');
    }
    
    const response = await client.chat.completions.create(request);
    
    console.log('LLM SUBJECTIVE END');
    const rawContent = response.choices[0]?.message?.content;
    console.log(rawContent);
    
    try {
        // Clean markdown code blocks from response (Qwen sometimes wraps JSON in ```json ... ```)
        let cleanedContent = rawContent?.trim() || "";
        if (cleanedContent.startsWith("```")) {
            cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
        }
        
        const result = JSON.parse(cleanedContent);
        return SubjectiveSchema.parse(result) as SubjectiveResult;
    } catch (error) {
        console.error('Failed to parse subjective response:', error);
        console.error('Raw content:', rawContent);
        return {
            reasoning: 'Failed to parse AI response',
            ocrResult: 'Unknown',
            suggestion: 'Failed to Generate Result',
            score: -1
        }
    }
}