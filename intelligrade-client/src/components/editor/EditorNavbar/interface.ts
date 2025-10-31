import { ExamResponse } from "@/types/exam";

export interface EditorNavbarProps {
    exam: ExamResponse;
    isSaved?: boolean;
    onSave: (exam: ExamResponse) => Promise<void>;
    onExportPDF: () => Promise<string>;
}