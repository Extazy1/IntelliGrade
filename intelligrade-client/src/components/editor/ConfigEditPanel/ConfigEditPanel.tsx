import { cn } from "@/lib/utils"
import { type ConfigEditPanelProps } from "./interface"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Settings } from "lucide-react"
import { ExamConfigForm } from "./ConfigForm/ExamConfigForm"
import { MCQConfigForm } from "./ConfigForm/MCQConfigForm"
import { FillInBlankConfigForm } from "./ConfigForm/FillInBlankConfigForm"
import { OpenQuestionConfigForm } from "./ConfigForm/OpenQuestionConfigForm"
import { useEffect, useState } from "react";
import { UnionComponent } from "@/types/exam"
import { nanoid } from "nanoid"

export function ConfigEditPanel({ className, handleExamSave, selectedComponentId, exam }: ConfigEditPanelProps) {
    const [selectedComponent, setSelectedComponent] = useState<UnionComponent | null>(null);

    // 根据 selectedComponentId 设置选中的组件
    useEffect(() => {
        if (selectedComponentId) {
            const component = exam.examData.components.find(component => component.id === selectedComponentId);
            setSelectedComponent(component as UnionComponent);
        } else {
            setSelectedComponent(null);
        }
    }, [selectedComponentId, exam.examData.components])

    return (
        <div className={cn("flex flex-col h-full", className)} >
            <div className="bg-gradient-to-r from-primary/3 to-primary/5 px-5 py-3 border-b">
                <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-semibold tracking-tight">Configuration</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Customize your exam paper settings and preferences</p>
            </div>
            <ScrollArea className="flex-1 p-4">
                {/* 如果 selectedComponentId 为 null 或者 selectedComponent 的类型为 header，则渲染 ExamConfigForm */}
                {selectedComponentId === null || selectedComponent === null || selectedComponent?.type.includes('header') ? (
                    <ExamConfigForm
                        exam={exam}
                        onExamConfigChange={handleExamSave}
                    />
                ) : selectedComponent?.type === 'multiple-choice' ? (
                    <MCQConfigForm
                        key={nanoid()}
                        mcq={selectedComponent}
                        exam={exam}
                        selectedComponentId={selectedComponentId}
                        onExamConfigChange={handleExamSave}
                    />
                ) : selectedComponent?.type === 'fill-in-blank' ? (
                    <FillInBlankConfigForm
                        key={nanoid()}
                        fillInBlank={selectedComponent}
                        exam={exam}
                        selectedComponentId={selectedComponentId}
                        onExamConfigChange={handleExamSave}
                    />
                ) : selectedComponent?.type === 'open' ? (
                    <OpenQuestionConfigForm
                        key={nanoid()}
                        openQuestion={selectedComponent}
                        exam={exam}
                        selectedComponentId={selectedComponentId}
                        onExamConfigChange={handleExamSave}
                    />
                ) : null}
            </ScrollArea>
        </div>
    )
} 