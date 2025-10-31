import { ExamSchedule, SubjectiveQuestion, Student, SubjectiveLLMResponse } from "@/types/types";
import { Dispatch, SetStateAction } from "react";

export interface Question {
    questionId: string;
    imageUrl: string;
    score: number;
    done: boolean;
}

export interface StudentQuestion {
    student: Student;
    question: SubjectiveQuestion;
}

export interface ExtendedSubjectiveQuestion {
    questionId: string;
    score: number;
    imageUrl: string;
    aiSuggestion: SubjectiveLLMResponse;
    done: boolean; // 是否已经完成
    studentId: string; // 添加学生ID以便定位具体是哪个学生的题目
    questionNumber: number; // 问题序号
}

export interface SubjectiveDoneProps {
    schedule: ExamSchedule;
    setSchedule: Dispatch<SetStateAction<ExamSchedule | null>>;
}

export interface AiCache {
    questionId: string;
    studentId: string;
    aiSuggestion: SubjectiveLLMResponse;
}