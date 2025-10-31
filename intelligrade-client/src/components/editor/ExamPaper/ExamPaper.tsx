import { type ExamPaperProps } from "./interface"

export function ExamPaper({ children }: ExamPaperProps) {
    return (
        <div className="bg-white shadow-lg w-[210mm] h-[297mm] mx-auto p-8">
            {children}
        </div>
    )
} 