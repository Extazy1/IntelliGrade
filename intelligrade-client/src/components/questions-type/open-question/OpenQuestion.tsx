import React from "react";
import { OpenQuestionProps } from "./interface";
import { Blank } from "@/components/layout-components/Blank";
import dynamic from "next/dynamic";

// Dynamic import RichInput to avoid SSR issues
const RichInput = dynamic(() => import('@/components/rich-editor/RichInput'), { ssr: false })

const OpenQuestion: React.FC<OpenQuestionProps> = ({
    questionNumber,
    questionObj,
    renderMode,
    onContentChange
}) => {
    const handleContentChange = (content: string) => {
        onContentChange(questionObj.id, content);
    };

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
            <div className="">
                <Blank lines={questionObj.lines} />
            </div>
        </div>
    );
};

export default OpenQuestion; 