import sharp from "sharp";
import fs from 'fs'
import { ExamScheduleResult } from "../../types/type";

type Axis = "x" | "y";

// 转换毫米到像素的函数
export function mmToPixels(mm: number, imageInfo: sharp.Metadata, axis: Axis): number {
    if (!Number.isFinite(mm)) {
        return 0;
    }

    const dimension = axis === "x" ? imageInfo.width : imageInfo.height;
    if (!dimension || dimension <= 0) {
        return 0;
    }

    const pageSizeMm = axis === "x" ? 210 : 297;
    const pixelsPerMm = dimension / pageSizeMm;
    return Math.round(mm * pixelsPerMm);
}

export function imageToBase64(image: string) {
    const imageBuffer = fs.readFileSync(image)
    const base64 = imageBuffer.toString('base64')
    return base64
}

export function ensureScheduleResult(result: unknown): ExamScheduleResult {
    let parsed: ExamScheduleResult;

    if (typeof result === "string") {
        try {
            parsed = JSON.parse(result) as ExamScheduleResult;
        } catch (error) {
            throw new Error(`Failed to parse schedule result JSON: ${error instanceof Error ? error.message : String(error)}`);
        }
    } else if (result && typeof result === "object") {
        parsed = result as ExamScheduleResult;
    } else {
        throw new Error("Schedule result is missing or invalid");
    }

    if (typeof parsed.error === "undefined") {
        parsed.error = null;
    }

    return parsed;
}

export function serialiseScheduleResult(result: ExamScheduleResult) {
    return JSON.parse(JSON.stringify(result));
}
