import type { Dispatch, SetStateAction } from "react";

export interface LoginResponse {
    jwt: string;
    user: {
        id: number;
        username: string;
        email: string;
        provider: string;
        confirmed: boolean;
        blocked: boolean;
        createdAt: string;
        updatedAt: string;
        documentId: string;
    };
}

export interface RegisterResponse {
    jwt: string;
    user: {
        id: number;
        username: string;
        email: string;
        provider: string;
        confirmed: boolean;
        blocked: boolean;
        createdAt: string;
        updatedAt: string;
        documentId: string;
    };
}

export interface ErrorResponse {
    error: {
        status: string; // HTTP status
        name: string; // Strapi error name ('ApplicationError' or 'ValidationError')
        message: string; // A human readable error message
        details: {
            [key: string]: string;
        };
    }
}

export interface AuthContextObject {
    authenticated: boolean;
    userName: string;
    email: string;
    jwt: string;
    id: string;
    documentId: string;
    isLoading: boolean;
    setAuthenticated: Dispatch<SetStateAction<boolean>>;
    setJwt: Dispatch<SetStateAction<string>>;
    setUserName: Dispatch<SetStateAction<string>>;
    setEmail: Dispatch<SetStateAction<string>>;
    setDocumentId: Dispatch<SetStateAction<string>>;
    setId: Dispatch<SetStateAction<string>>;
    logout: () => Promise<void>;
}

export interface Student {
    name: string;
    studentId: string;
    documentId: string;
    publishedAt: string;
}

export interface User {
    documentId: string;
    id: string;
    userName: string;
    email: string;
}

export interface Class {
    name: string;
    documentId: string;
    publishedAt: string;
    students: Student[];
    teacher: User;
}


export interface ExamSchedule {
    documentId: string;
    name: string;
    exam: ExamResponse;
    class: Class;
    teacher: User;
    result: ExamScheduleResult;
}

// 所有统计数据
export interface ExamStatistics {
    average: number; // 平均分
    highest: number; // 最高分
    lowest: number; // 最低分
    median: number; // 中位数
    standardDeviation: number; // 标准差
    questions: ExamQuestionStatistics[];
}

// 每个题目的数据
export interface ExamQuestionStatistics {
    questionId: string;
    average: number; // 平均分
    highest: number; // 最高分
    lowest: number; // 最低分
    median: number; // 中位数
    standardDeviation: number; // 标准差
    correct: number; // 正确人数 (客观题才有)
    incorrect: number; // 错误人数 (客观题才有)
}

/**
 * CREATED: 已经创建Schedule,但还没有上传PDF
 * UPLOADED: 已经上传PDF,但还没有开始流水线
 * MATCH_START: 第一部分流水线已经开始（识别学生id，匹配结果）
 * MATCH_DONE: 匹配结果以经生成完毕
 * DONE: 流水线已经完成,可以去查看结果
 */
type ExamScheduleProgress = 'CREATED' | 'UPLOADED' | 'MATCH_START' | 'MATCH_DONE' | 'OBJECTIVE_START' | 'OBJECTIVE_DONE' | 'SUBJECTIVE_START' | 'SUBJECTIVE_DONE' | 'RESULT_START' | 'RESULT_DONE'

// 在试卷提交后的所有数据
export interface ExamScheduleResult {
    progress: ExamScheduleProgress;
    pdfUrl: string; // 试卷PDF的url, '/uploads/exam_scan_732425fbd9.pdf
    papers: Paper[]; // 在服务器切割完PDF后设置这个字段
    studentPapers: StudentPaper[]; // 学生答卷,根据卷头信息匹配对应的paper
    matchResult: MatchResult;
    statistics: ExamStatistics;
    error?: {
        stage: string;
        message: string;
        details?: string;
        timestamp?: string;
    } | null;
}

// 试卷匹配结果
export interface MatchResult {
    matched: {
        studentId: string;
        paperId: string;
        headerImgUrl: string;
    }[],
    unmatched: {
        studentIds: string[];
        papers: {
            paperId: string;
            headerImgUrl: string;
        }[]
    }
    done: boolean;
}

export interface Paper {
    paperId: string; // 试卷id
    startPage: number; // 开始页码
    endPage: number; // 结束页码
    name: string; // 学生姓名
    studentId: string; // 学生id
    studentDocumentId: string; // 学生documentId
    headerImgUrl: string; // 试卷头图片url
    questionImageMap: Record<string, string>;
}

export interface StudentPaper {
    student: Student;
    paperId: string; // 答卷id，未匹配为null,这个ID会在拆分PDF的时候生成
    objectiveQuestions: ObjectiveQuestion[];
    subjectiveQuestions: SubjectiveQuestion[];
    totalScore: number; // 从0往上加
}

export interface ObjectiveQuestion {
    questionId: string;
    studentAnswer: string[];
    llmUnknown: boolean; // 是否是LLM识别失败
    score: number; // 这道题的得分
    imageUrl: string;
}

export interface SubjectiveQuestion {
    questionId: string;
    score: number;
    imageUrl: string;
    aiSuggestion: SubjectiveLLMResponse;
    done: boolean; // 是否已经完成
    questionNumber: number; // 问题序号
}

export interface SubjectiveLLMResponse {
    reasoning: string;
    score: number;
    ocrResult: string;
    suggestion: string;
}

export interface LLMSubjectiveInput {
    question: string;
    answer: string; // 参考答案
    score: number; // 这道题的总分
    imageUrl: string; // 题目图片,不带域名
}