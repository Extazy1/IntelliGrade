import { ExamResponse, FillInBlankQuestionData } from "@/types/exam";

interface FillInBlankConfigFormProps {
    fillInBlank: FillInBlankQuestionData;
    exam: ExamResponse;
    selectedComponentId: string;
    onExamConfigChange: (updatedExam: ExamResponse) => Promise<void>;
}

export type { FillInBlankConfigFormProps }; 