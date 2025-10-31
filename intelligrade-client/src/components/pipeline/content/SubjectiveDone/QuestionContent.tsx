import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { IMAGE_PREFIX } from "@/lib/host";
import { ExtendedSubjectiveQuestion, Question } from "./interface";
import { SubjectiveQuestion } from "@/types/types";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogClose,
    DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

export interface QuestionContentProps {
    currentQuestion: ExtendedSubjectiveQuestion | null;
    questionDef: SubjectiveQuestion;
    progress: number;
    total: number;
    finished: number;
    onScoreSubmit: (score: number) => void;
    onPrevious: () => void;
    onNext: () => void;
    isSubmitting?: boolean;
    handleContinue: () => void;
    isLoadingContinue: boolean;
}

export default function QuestionContent({
    currentQuestion,
    progress,
    total,
    finished,
    questionDef,
    onScoreSubmit,
    onPrevious,
    onNext,
    isSubmitting = false,
    handleContinue,
    isLoadingContinue
}: QuestionContentProps) {
    const [showImagePreview, setShowImagePreview] = useState(false);

    const handleScoreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const scoreInput = form.elements.namedItem("score") as HTMLInputElement;
        const score = parseFloat(scoreInput.value);

        if (!isNaN(score)) {
            onScoreSubmit(score);
        }
    };

    return (
        <div className="flex-1 px-6">
            {/* Progress bar */}
            <Progress value={progress} className="w-full h-2 mb-8" />

            {currentQuestion ? (
                <>
                    {/* Question image */}
                    <Card className="w-full mb-6">
                        <CardContent className="p-6">
                            {currentQuestion.imageUrl ? (
                                <div className="relative w-full h-[300px]">
                                    <Image
                                        src={`${IMAGE_PREFIX}/${currentQuestion.imageUrl}`}
                                        alt="Question"
                                        fill
                                        className="object-contain hover:cursor-pointer"
                                        onClick={() => setShowImagePreview(true)}
                                    />
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    Question Image
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Image Preview Dialog */}
                    <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
                        <DialogContent className="max-w-4xl p-0 flex items-center justify-center bg-transparent border-0 shadow-none">
                            <DialogTitle className="sr-only">Question Image Preview</DialogTitle>
                            <DialogClose className="absolute right-2 top-2 z-10 rounded-full bg-background p-1 text-foreground opacity-70 hover:opacity-100" />
                            {currentQuestion.imageUrl && (
                                <img
                                    src={`${IMAGE_PREFIX}/${currentQuestion.imageUrl}`}
                                    alt="Question Preview"
                                    className="max-w-full max-h-[80vh] object-contain rounded-md"
                                />
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Score and progress section */}
                    <div className="w-full flex justify-between mb-8">
                        <div className="flex items-center">
                            <span className="text-muted-foreground mr-2">Mark:</span>
                            <span className="font-semibold">{questionDef.score}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-muted-foreground mr-2">Progress:</span>
                            <span className="font-semibold">{`${finished}/${total}`}</span>
                        </div>
                        <Button
                            onClick={handleContinue}
                            disabled={isLoadingContinue || finished < total}
                            className="px-4 w-24"
                        >
                            {isLoadingContinue ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <>
                                Done
                                <ArrowRight />
                            </>}
                        </Button>
                    </div>

                    {/* Score input and submit form */}
                    <form onSubmit={handleScoreSubmit} className="w-full mb-8">
                        <div className="w-full flex-1 flex items-center justify-center">
                            <span className="text-muted-foreground mr-4 font-medium">Score:</span>
                            <Input
                                autoFocus
                                type="number"
                                name="score"
                                min="0"
                                max={questionDef.score}
                                step="0.5"
                                defaultValue={0}
                                className="w-24 mr-4"
                                placeholder="Enter score"
                                disabled={isSubmitting}
                            />
                            <Button type="submit" className="w-24 px-8" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    "Submit"
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* Navigation buttons */}
                    <div className="w-full flex justify-between">
                        <Button
                            onClick={onPrevious}
                            variant="ghost"
                            className="flex items-center"
                            disabled={isSubmitting}
                        >
                            <ChevronLeft className="h-5 w-5 mr-1" />
                            prev
                        </Button>
                        <Button
                            onClick={onNext}
                            variant="ghost"
                            className="flex items-center"
                            disabled={isSubmitting}
                        >
                            next
                            <ChevronRight className="h-5 w-5 ml-1" />
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex h-96 items-center justify-center">
                    <p className="text-muted-foreground">Select a question to start marking</p>
                </div>
            )}
        </div>
    );
} 