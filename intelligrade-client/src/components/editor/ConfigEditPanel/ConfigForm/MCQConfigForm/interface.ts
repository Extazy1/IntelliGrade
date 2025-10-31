import { ExamResponse, MultipleChoiceQuestionData } from "@/types/exam";

export interface MCQConfigFormProps {
    mcq: MultipleChoiceQuestionData;
    exam: ExamResponse;
    selectedComponentId: string;
    onExamConfigChange: (updatedExam: ExamResponse) => Promise<void>;
} 