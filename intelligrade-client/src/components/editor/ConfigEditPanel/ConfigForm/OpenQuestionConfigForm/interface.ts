import { ExamResponse, OpenQuestionData } from "@/types/exam";

interface OpenQuestionConfigFormProps {
    openQuestion: OpenQuestionData;
    exam: ExamResponse;
    selectedComponentId: string;
    onExamConfigChange: (updatedExam: ExamResponse) => Promise<void>;
}

export type { OpenQuestionConfigFormProps }; 