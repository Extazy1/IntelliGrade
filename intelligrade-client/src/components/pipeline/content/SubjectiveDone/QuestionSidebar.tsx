import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExtendedSubjectiveQuestion } from "./interface";
import { ExamSchedule } from "@/types/types";
import { getQuestionDef } from "./SubjectiveDone";
export interface QuestionSidebarProps {
    questions: ExtendedSubjectiveQuestion[];
    currentQuestion: ExtendedSubjectiveQuestion | null;
    onQuestionSelect: (questionId: string, studentId: string) => void;
    schedule: ExamSchedule;
}

export default function QuestionSidebar({
    questions,
    currentQuestion,
    onQuestionSelect,
    schedule
}: QuestionSidebarProps) {
    // 去重
    const uniqueQuestions = questions.filter((question, index, self) =>
        index === self.findIndex((t) => t.questionId === question.questionId)
    );

    return (
        <div className="w-full pr-4 border-r h-full">
            <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-6 py-2">
                    {uniqueQuestions.map((question, qIndex) => (
                        <div key={`${question.questionId}-${qIndex}`} className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground">Question {getQuestionDef(schedule, question.questionId).questionNumber}</h3>
                            <div className="flex flex-wrap gap-2">
                                {questions
                                    .filter(q => q.questionId === question.questionId)
                                    .map((q, index) => {
                                        const isActive = currentQuestion?.questionId === question.questionId &&
                                            q.studentId === currentQuestion.studentId;
                                        return (
                                            <Button
                                                key={`${question.questionId}-${q.studentId}`}
                                                variant={isActive ? "default" : "outline"}
                                                size="sm"
                                                className={cn(
                                                    "w-10 h-10 rounded-md relative",
                                                    isActive && "shadow-sm",
                                                    q.done && !isActive && "border-green-200"
                                                )}
                                                onClick={() => onQuestionSelect(question.questionId, q.studentId)}
                                            >
                                                <span className={cn(
                                                    "absolute inset-0 flex items-center justify-center",
                                                    isActive && "font-medium"
                                                )}>
                                                    {index + 1}
                                                </span>
                                                {q.done && (
                                                    <span className="absolute bottom-1 right-1 text-green-500">
                                                        <Check className="h-3 w-3" />
                                                    </span>
                                                )}
                                            </Button>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
} 