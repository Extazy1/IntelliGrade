'use client'

import { ExamResponse } from "@/types/exam";
import { useEffect, useState } from "react";
import { RenderContainerProps } from "./interface";
import { getExamById } from "@/lib/api";
import { A4ExamPaper } from "@/components/editor/A4ExamPaper";

export function RenderContainer({ documentId }: RenderContainerProps) {
    const [exam, setExam] = useState<ExamResponse | null>(null);

    useEffect(() => {
        const fetchExam = async () => {
            const exam = await getExamById(documentId);
            setExam(exam.data);
        }
        fetchExam();
    }, [documentId])

    return (
        <div>
            {exam && (
                <A4ExamPaper
                    exam={exam}
                    renderMode={true}
                    pdfMode={true}
                    scale={1}
                    forceUpdate={false}
                    onMCQQuestionChange={() => { }}
                    onMCQOptionChange={() => { }}
                    onFillInBlankContentChange={() => { }}
                    onOpenQuestionChange={() => { }}
                    handleComponentClick={() => { }}
                    handleComponentDelete={() => { }}
                    setExam={setExam}
                />
            )}
        </div>
    )
}