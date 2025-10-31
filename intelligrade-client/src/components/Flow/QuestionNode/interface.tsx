import { ExamSchedule } from "@/types/types";

export interface QuestionNodeProps {
    data: {
        questionId: string;
        schedule: ExamSchedule;
    }
}

export interface StudentAnswer {
    studentName: string;
    studentId: string
    answer: string[];
    answerImg: string;
    score: number;
}