import { ExamResponse } from "@/types/exam";

interface ConfigEditPanelProps {
    className: string
    selectedComponentId: string | null
    exam: ExamResponse
    handleExamSave: (exam: ExamResponse) => Promise<void>
}

export type { ConfigEditPanelProps }; 