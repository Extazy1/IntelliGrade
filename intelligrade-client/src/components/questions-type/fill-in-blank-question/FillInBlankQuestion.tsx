'use client'

import dynamic from 'next/dynamic'
import { FillInBlankQuestionProps } from './interface'

// Use dynamic import to avoid SSR issues
const RichInput = dynamic(() => import('@/components/rich-editor/RichInput'), { ssr: false })

/**
 * Fill-in-blank question component
 * A simple wrapper around RichInput that displays a question number
 */
const FillInBlankQuestion: React.FC<FillInBlankQuestionProps> = ({
    questionObj,
    onContentChange,
    renderMode,
    questionNumber,
}) => {
    const handleContentChange = (newContent: string) => {
        onContentChange(questionObj.id, newContent)
    }

    return (
        <div className="my-2">
            <div className="flex items-center justify-start">
                {questionNumber !== undefined && (
                    <div className="font-medium text-base">
                        {questionNumber}.
                    </div>
                )}
                <RichInput
                    initialContent={questionObj.content}
                    onContentChange={handleContentChange}
                    renderMode={renderMode}
                />
            </div>
            <div className="text-muted-foreground ml-6 text-sm flex justify-end">
                [{questionObj.score} marks]
            </div>
        </div>
    )
}

export default FillInBlankQuestion 