import { ExamResponse, Position } from "@/types/exam";

export interface CanvasSharedProps {
    exam: ExamResponse
    renderMode: boolean // 是否显示富文编辑器
    pdfMode: boolean // pdf导出模式
    onMCQQuestionChange: (questionId: string, content: string) => void
    onMCQOptionChange: (questionId: string, optionIndex: number, content: string) => void
    onFillInBlankContentChange: (questionId: string, content: string) => void
    onOpenQuestionChange: (questionId: string, content: string) => void
    handleComponentClick: (componentId: string | null) => void
    setExam: React.Dispatch<React.SetStateAction<ExamResponse | null>>
    handleComponentDelete: (componentId: string) => void
}


export interface CanvasProps extends CanvasSharedProps {
    onRenderModeChange: (mode: boolean) => void
}