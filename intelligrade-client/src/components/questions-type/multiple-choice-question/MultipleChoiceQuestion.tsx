'use client'

import dynamic from 'next/dynamic'
import { MultipleChoiceQuestionProps } from './interface'

// Use dynamic import to avoid SSR issues
const RichInput = dynamic(() => import('@/components/rich-editor/RichInput'), { ssr: false })

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
    questionObj,
    onQuestionChange,
    onOptionChange,
    renderMode = false,
    questionNumber,
}) => {
    const handleQuestionChange = (content: string) => {
        onQuestionChange(questionObj.id, content)
    }

    const handleOptionChange = (index: number, content: string) => {
        onOptionChange(questionObj.id, index, content)
    }

    return (
        <div className='my-2'>
            <div className="flex items-center justify-start">
                {questionNumber !== undefined && (
                    <div className="font-medium text-base">
                        {questionNumber}.
                    </div>
                )}
                <RichInput
                    initialContent={questionObj.question}
                    onContentChange={handleQuestionChange}
                    renderMode={renderMode}
                />
            </div>
            <div className="pl-8 mt-1 space-y-1">
                {questionObj.options.map((option, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="font-medium text-base w-6 flex items-center">
                            {String.fromCharCode(65 + index)}.
                        </div>
                        <div className="">
                            <RichInput
                                initialContent={option.content}
                                onContentChange={(content) => handleOptionChange(index, content)}
                                renderMode={renderMode}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-muted-foreground ml-6 text-sm flex justify-end">
                [{questionObj.score} marks]
            </div>
        </div>
    )
}

export default MultipleChoiceQuestion 