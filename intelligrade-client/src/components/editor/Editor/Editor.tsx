'use client'
import React, { useState, useEffect } from "react"
import { EditorNavbar } from "@/components/editor/EditorNavbar"
import { SectionSelection } from "@/components/editor/SectionSelection"
import { QuestionSelectionPanel } from "@/components/editor/QuestionSelectionPanel"
import { Canvas } from "@/components/editor/Canvas"
import { ConfigEditPanel } from "@/components/editor/ConfigEditPanel"
import { Button } from "@/components/ui/button"
import { MultipleChoiceQuestionData, FillInBlankQuestionData, OpenQuestionData, UnionComponent, ExamResponse, Position } from "@/types/exam"
import { nanoid } from "nanoid"
import cloneDeep from 'lodash/cloneDeep'
import { TemplateSelectionPanel } from "@/components/editor/TemplateSelectionPanel"
import { BankSelectionPanel } from "@/components/editor/BankSelectionPanel"
import { EditorProps } from "./interface";
import { getExamById, getExportedPDFUrl, updateExam } from "@/lib/api"
import { Loader2, MoveLeft } from "lucide-react"
import Link from "next/link"

export default function Editor({ documentId }: EditorProps) {
    const [exam, setExam] = useState<ExamResponse | null>(null);
    const [renderMode, setRenderMode] = useState(true);
    const [activeTab, setActiveTab] = useState("components");
    const [isSaved, setIsSaved] = useState(true);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchExam = async () => {
            setIsLoading(true);
            const response = await getExamById(documentId);
            setExam(response.data);
            setIsLoading(false);
        }
        fetchExam();
    }, [documentId])

    const onMCQQuestionChange = (questionId: string, content: string) => {
        setIsSaved(false);
        setExam(prev => {
            if (!prev) return null;
            const updatedExam = cloneDeep(prev);
            if (!updatedExam) return null;
            const questionIndex = updatedExam.examData.components.findIndex((component: UnionComponent) => component.id === questionId)
            if (questionIndex !== -1) {
                (updatedExam.examData.components[questionIndex] as MultipleChoiceQuestionData).question = content
            }
            return updatedExam
        })
    }

    const onMCQOptionChange = (questionId: string, optionIndex: number, content: string) => {
        setIsSaved(false);
        setExam(prev => {
            if (!prev) return null;
            const updatedExam = cloneDeep(prev);
            if (!updatedExam) return null;
            const questionIndex = updatedExam.examData.components.findIndex((component: UnionComponent) => component.id === questionId)
            if (questionIndex !== -1) {
                (updatedExam.examData.components[questionIndex] as MultipleChoiceQuestionData).options[optionIndex].content = content
            }
            return updatedExam
        })
    }

    const onFillInBlankContentChange = (questionId: string, content: string) => {
        setIsSaved(false);
        setExam(prev => {
            if (!prev) return null;
            const updatedExam = cloneDeep(prev);
            if (!updatedExam) return null;
            const questionIndex = updatedExam.examData.components.findIndex((component: UnionComponent) => component.id === questionId)
            if (questionIndex !== -1) {
                (updatedExam.examData.components[questionIndex] as FillInBlankQuestionData).content = content
            }
            return updatedExam
        })
    }

    const onOpenQuestionChange = (questionId: string, content: string) => {
        setIsSaved(false);
        setExam(prev => {
            if (!prev) return null;
            const updatedExam = cloneDeep(prev);
            if (!updatedExam) return null;
            const questionIndex = updatedExam.examData.components.findIndex((component: UnionComponent) => component.id === questionId)
            if (questionIndex !== -1) {
                (updatedExam.examData.components[questionIndex] as OpenQuestionData).content = content
            }
            return updatedExam
        })
    }

    const handleComponentClick = (componentId: string | null) => {
        setSelectedComponentId(componentId);
    }

    const handleAddComponent = (componentType: string) => {
        setIsSaved(false);
        setExam(prev => {
            if (!prev) return null;
            const updatedExam = cloneDeep(prev);
            if (!updatedExam) return null;
            let newComponent: UnionComponent;

            // 根据组件类型创建不同的组件
            switch (componentType) {
                case 'multiple-choice-question':
                    newComponent = {
                        id: nanoid(),
                        type: 'multiple-choice',
                        score: 5,
                        questionNumber: updatedExam.examData.components.length,
                        question: '<p>New multiple choice question</p>',
                        options: [
                            { label: 'A', content: '<p>Option A</p>' },
                            { label: 'B', content: '<p>Option B</p>' },
                            { label: 'C', content: '<p>Option C</p>' },
                            { label: 'D', content: '<p>Option D</p>' }
                        ],
                        answer: ['A']
                    };
                    break;
                case 'fill-in-blank-question':
                    newComponent = {
                        id: nanoid(),
                        type: 'fill-in-blank',
                        score: 5,
                        questionNumber: updatedExam.examData.components.length,
                        content: '<p>New fill-in-the-blank question ${input}</p>',
                        answer: 'The answer is XXX'
                    };
                    break;
                case 'open-question':
                    newComponent = {
                        id: nanoid(),
                        type: 'open',
                        score: 10,
                        questionNumber: updatedExam.examData.components.length,
                        content: '<p>New open question</p>',
                        answer: 'The answer is XXX',
                        lines: 10
                    };
                    break;
                case 'blank':
                    newComponent = {
                        id: nanoid(),
                        type: 'blank',
                        lines: 5
                    };
                    break;
                case 'divider':
                    newComponent = {
                        id: nanoid(),
                        type: 'divider'
                    };
                    break;
                default:
                    return prev; // 如果类型不匹配，返回原状态
            }

            updatedExam.examData.components.push(newComponent);
            return updatedExam;
        });
    }

    const handleTemplateSelect = (templateId: string) => {
        // TODO: Load template data
        console.log("Selected template:", templateId);
    };

    const handleBankSelect = (bankId: string) => {
        // TODO: Load questions from bank
        console.log("Selected bank:", bankId);
    };

    const handleExamSave = async (updatedExam: ExamResponse) => {
        if (!exam) return;
        setExam(updatedExam);
        await updateExam(documentId, updatedExam);
        setIsSaved(true);
    }

    const handleExportPDF = async () => {
        const response = await getExportedPDFUrl(documentId);
        return response
    }

    // 删除组件
    const handleComponentDelete = (componentId: string) => {
        setIsSaved(false);
        setExam(prev => {
            if (!prev) return null;
            const updatedExam = cloneDeep(prev);
            if (!updatedExam) return null;
            const questionIndex = updatedExam.examData.components.findIndex((component: UnionComponent) => component.id === componentId)
            if (questionIndex !== -1) {
                updatedExam.examData.components.splice(questionIndex, 1);
            }
            return updatedExam;
        })
    }

    const renderSidePanel = () => {
        switch (activeTab) {
            case "components":
                return <QuestionSelectionPanel className="w-64 border-r shrink-0" onAddComponent={handleAddComponent} />;
            case "templates":
                return <TemplateSelectionPanel className="w-64 border-r shrink-0" onSelectTemplate={handleTemplateSelect} />;
            case "bank":
                return <BankSelectionPanel className="w-64 border-r shrink-0" onSelectBank={handleBankSelect} />;
            default:
                return null;
        }
    };

    const renderLoading = () => {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg">Loading Exam...</p>
                </div>
            </div>
        )
    }

    const renderContent = () => {
        if (!exam) return null;

        return (
            <div className="flex h-[calc(100vh-4rem)]">
                {/* <SectionSelection
                    className="w-33 border-r shrink-0"
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                /> */}
                {renderSidePanel()}
                <div className="flex-1 min-w-0 overflow-auto">
                    <Canvas
                        exam={exam}
                        setExam={setExam}
                        renderMode={renderMode}
                        pdfMode={false}
                        onRenderModeChange={setRenderMode}
                        onMCQQuestionChange={onMCQQuestionChange}
                        onMCQOptionChange={onMCQOptionChange}
                        onFillInBlankContentChange={onFillInBlankContentChange}
                        onOpenQuestionChange={onOpenQuestionChange}
                        handleComponentClick={handleComponentClick}
                        handleComponentDelete={handleComponentDelete}
                    />
                </div>
                <ConfigEditPanel
                    handleExamSave={handleExamSave}
                    selectedComponentId={selectedComponentId}
                    exam={exam}
                    className="w-80 border-l shrink-0"
                />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {exam ? (
                <EditorNavbar exam={exam} isSaved={isSaved} onSave={handleExamSave} onExportPDF={handleExportPDF} />
            ) : (
                <nav className="flex h-[50px] items-center border-b px-4 justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href="/">
                                <MoveLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1>Loading Exam...</h1>
                    </div>
                </nav>
            )}
            {isLoading ? renderLoading() : renderContent()}
        </div>
    )
}   