import { OpenQuestionData } from "@/types/exam";

export interface OpenQuestionProps {
    questionObj: OpenQuestionData;
    renderMode: boolean;
    questionNumber: number;
    onContentChange: (questionId: string, content: string) => void;
} 