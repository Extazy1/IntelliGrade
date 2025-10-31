import { FillInBlankQuestionData } from "@/types/exam";

export interface FillInBlankQuestionProps {
    /**
     * Question object
     */
    questionObj: FillInBlankQuestionData

    /**
     * Callback when content changes
     */
    onContentChange: (questionId: string, content: string) => void;

    /**
     * Render mode - hides editor borders and disables editing
     */
    renderMode: boolean;

    /**
     * Question number to display
     */
    questionNumber: number;
} 