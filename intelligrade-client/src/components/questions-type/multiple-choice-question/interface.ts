import { MCQOption, MultipleChoiceQuestionData } from "@/types/exam";

export interface MultipleChoiceQuestionProps {
    /**
     * Question object
     */
    questionObj: MultipleChoiceQuestionData

    /**
     * Question content change callback
     */
    onQuestionChange: (questionId: string, content: string) => void;

    /**
     * Option content change callback
     */
    onOptionChange: (questionId: string, optionIndex: number, content: string) => void;

    /**
     * Render mode - hides editor borders and disables editing
     */
    renderMode: boolean;

    /**
     * Question number to display
     */
    questionNumber: number;
}
