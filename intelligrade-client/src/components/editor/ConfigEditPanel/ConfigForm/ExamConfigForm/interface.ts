import { ExamResponse } from "@/types/exam";

interface ExamConfigFormProps {
    exam: ExamResponse;
    onExamConfigChange: (updatedExam: ExamResponse) => Promise<void>;
}

export type { ExamConfigFormProps }; 