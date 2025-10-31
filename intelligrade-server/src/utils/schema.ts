import { z } from "zod"

export const HeaderSchema = z.object({
    reason: z.string().describe('Reason for the answer. Think step by step. Output this field first.'),
    name: z.string().describe('Student name'),
    studentId: z.string().describe('Student ID'),
})

export interface Header {
    name: string;
    studentId: string;
}

export const MCQSchema = z.object({
    reason: z.string().describe('Reason for the answer. Think step by step. Output this field first.'),
    answer: z.array(z.string()).describe('Answers, such as ["A"], ["B", "C"]'),
})

export interface MCQResult {
    answer: string[];
}

export const SubjectiveSchema = z.object({
    reasoning: z.string().describe('Your reasoning process, this field must be output first, think step by step, use English'),
    ocrResult: z.string().describe('The handwritten answers recognized by OCR, if OCR recognition fails, please output "OCR Failed"'),
    suggestion: z.string().describe('Scoring suggestions for the teacher, concise and clear, use English'),
    score: z.number().describe('Score for the teacher, score range is [0, ${question_score}]'),
})

export interface SubjectiveResult {
    reasoning: string;
    ocrResult: string;
    suggestion: string;
    score: number;
}

export interface SubjectiveInput {
    question: string;
    answer: string;
    score: number
    imageUrl: string; // 不带域名
}
