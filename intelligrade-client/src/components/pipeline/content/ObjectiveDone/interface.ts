import { Dispatch } from "react";
import { SetStateAction } from "react";
import { ExamSchedule, ObjectiveQuestion } from "../../../../types/types";
import { MultipleChoiceQuestionData } from "@/types/exam";

export interface ObjectiveDoneProps {
    schedule: ExamSchedule;
    setSchedule: Dispatch<SetStateAction<ExamSchedule | null>>
}

export interface QuestionReviewProps {
    question: ExtendedObjectiveQuestion;
    definedQuestion: MultipleChoiceQuestionData;
    onMarkCorrect: () => void;
    onMarkIncorrect: () => void;
    onPrevious: () => void;
    onNext: () => void;
    progress: number;
    isLoading?: boolean;
    total: number;
    finished: number;
}

// 扩展ObjectiveQuestion接口，添加studentId属性用于标识题目所属学生
export interface ExtendedObjectiveQuestion {
    questionId: string;
    studentAnswer: string[];
    llmUnknown: boolean;
    score: number;
    imageUrl: string;
    studentId: string; // 添加学生ID以便定位具体是哪个学生的题目
}

export interface AllQuestionsFlowProps {
    handleNextStep: () => void;
    schedule: ExamSchedule;
}
