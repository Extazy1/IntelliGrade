import fs from "fs";
import path from "path";
import type { ExamResponse } from "../../../../types/exam";
import { generateExamPdf } from "../../../utils/pdf-generator";

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

const firstHeaderValue = (value?: string) => {
  if (!value) {
    return undefined;
  }

  return value
    .split(",")
    .map((segment) => segment.trim())
    .find((segment) => segment.length > 0);
};

const normalizePrefix = (value?: string) => {
  const first = firstHeaderValue(value);

  if (!first) {
    return "";
  }

  const sanitized = first
    .replace(/\s+/g, "")
    .replace(/\/+$/, "")
    .replace(/^\/+/, "");

  if (!sanitized) {
    return "";
  }

  return `/${sanitized}`;
};

const joinUrl = (base: string, pathname: string) => {
  const normalizedBase = trimTrailingSlashes(base);
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (!normalizedBase) {
    return normalizedPath;
  }

  return `${normalizedBase}${normalizedPath}`;
};

const normalizeProtocol = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "http" || normalized === "https") {
    return normalized;
  }

  return undefined;
};

const shouldForceHttp = () =>
  (process.env.PDF_FORCE_HTTP ?? "true").toLowerCase() !== "false";

const resolveRestPrefix = () => {
  const configuredPrefix = strapi?.config?.get?.("api.rest.prefix");

  if (typeof configuredPrefix === "string" && configuredPrefix.trim()) {
    return configuredPrefix.startsWith("/")
      ? configuredPrefix.trim()
      : `/${configuredPrefix.trim()}`;
  }

  return "/api";
};

const stripRestPrefix = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const restPrefix = resolveRestPrefix();

  if (!restPrefix) {
    return value;
  }

  if (value === restPrefix) {
    return "";
  }

  if (value.endsWith(restPrefix)) {
    const trimmed = value.slice(0, value.length - restPrefix.length);
    return trimmed;
  }

  return value;
};

const resolvePublicBaseUrl = (ctx: any): string | undefined => {
  const envCandidate = [
    process.env.PDF_PUBLIC_URL,
    process.env.STRAPI_PDF_PUBLIC_URL,
    process.env.PUBLIC_URL,
    process.env.STRAPI_PUBLIC_URL,
    strapi?.config?.get?.("server.url"),
  ]
    .map((candidate) =>
      typeof candidate === "string" ? candidate.trim() : undefined
    )
    .find((candidate) => candidate);

  if (envCandidate) {
    return trimTrailingSlashes(envCandidate);
  }

  const forwardedProto = normalizeProtocol(ctx.get?.("x-forwarded-proto"));
  const forwardedHost = firstHeaderValue(ctx.get?.("x-forwarded-host"));
  const forwardedPrefix = stripRestPrefix(
    normalizePrefix(ctx.get?.("x-forwarded-prefix"))
  );

  const enforcedProtocol = normalizeProtocol(
    process.env.PDF_PUBLIC_PROTOCOL
  );
  const shouldPreferHttp = shouldForceHttp();

  let proto =
    enforcedProtocol ||
    forwardedProto ||
    normalizeProtocol(ctx.protocol) ||
    undefined;

  if (!proto || (proto === "https" && shouldPreferHttp)) {
    proto = "http";
  }

  const host = forwardedHost || ctx.host;

  if (host) {
    const origin = trimTrailingSlashes(`${proto}://${host}`);
    if (forwardedPrefix) {
      return trimTrailingSlashes(`${origin}${forwardedPrefix}`);
    }
    return origin;
  }

  if (forwardedPrefix) {
    return trimTrailingSlashes(forwardedPrefix);
  }

  return undefined;
};

export default {
  // 获取PDF列表
  async find(ctx) {
    // 处理列表请求的逻辑
    if (!ctx.params.id) {
      return ctx.send({
        data: {
          message: "DocumentID is required",
        },
      });
    }

    try {
      // 从参数中获取documentId
      const documentId = ctx.params.id;
      const examData = await strapi
        .documents("api::exam.exam")
        .findOne({
          documentId,
        });

      if (!examData) {
        return ctx.notFound("Exam not found");
      }

      const exam = examData as unknown as ExamResponse;

      // 确保目录存在
      const pdfDir = path.resolve("./public/pdf");
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      // 生成 PDF 文件
      const pdfFileName = `Exam-${documentId}.pdf`;
      const pdfPath = path.join(pdfDir, pdfFileName);

      console.log(`开始生成pdf文件 ${documentId}`);
      await generateExamPdf(exam, pdfPath);
      console.log(`pdf生成成功 ${documentId}`);

      // 检查文件是否生成成功
      if (!fs.existsSync(pdfPath)) {
        return ctx.badRequest("PDF generation failed");
      }

      const pdfRelativePath = `/pdf/${pdfFileName}`;
      const publicBaseUrl = resolvePublicBaseUrl(ctx);
      const forwardedPrefix = normalizePrefix(ctx.get?.("x-forwarded-prefix"));

      const pdfUrl = publicBaseUrl
        ? joinUrl(publicBaseUrl, pdfRelativePath)
        : forwardedPrefix
        ? joinUrl(forwardedPrefix, pdfRelativePath)
        : pdfRelativePath;

      // 返回文件URL（相对或绝对路径，由客户端负责处理前缀）
      return ctx.send({
        data: {
          url: pdfUrl,
        },
      });
    } catch (error) {
      strapi.log.error("PDF generation failed", error);
      return ctx.badRequest("PDF generation failed");
    }
  },
};
