import { useState, useEffect } from "react";
import { QuestionDetailsProps, StudentAnswer } from "./interface";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { IMAGE_PREFIX } from "@/lib/host";
import { CircleCheck, CircleX, Eye } from "lucide-react";
import { BaseQuestion } from "@/types/exam";

export default function QuestionDetails({
    isOpen,
    onClose,
    questionStats,
    questionIndex,
    studentAnswers,
    exam,
}: QuestionDetailsProps) {
    const [selectedStudent, setSelectedStudent] = useState<StudentAnswer | null>(null);
    const [showDetailView, setShowDetailView] = useState(false);

    // Calculate statistics for this specific question
    const correctRate = questionStats.correct !== undefined && questionStats.incorrect !== undefined
        ? (questionStats.correct / (questionStats.correct + questionStats.incorrect)) * 100
        : null;

    // Helper for finding the question definition from exam
    const getQuestionDef = (questionId: string) => {
        const component = exam.examData.components.find((component) => component.id === questionId);
        return component as BaseQuestion | undefined;
    };

    // View student details
    const handleViewStudentAnswer = (studentAnswer: StudentAnswer) => {
        setSelectedStudent(studentAnswer);
        setShowDetailView(true);
    };

    // Back to list view
    const handleBackToList = () => {
        setShowDetailView(false);
        setSelectedStudent(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Question {questionIndex + 1} Analysis</DialogTitle>
                    <DialogDescription>
                        Detailed analysis of student answers for this question
                    </DialogDescription>
                </DialogHeader>

                {!showDetailView ? (
                    <div className="flex flex-col space-y-4 overflow-hidden">
                        {/* Question statistics */}
                        <Card>
                            <CardHeader className="py-4">
                                <CardTitle className="text-base">Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-3 gap-4 pb-4">
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Average</span>
                                    <span className="text-xl font-bold">{questionStats.average.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Highest</span>
                                    <span className="text-xl font-bold">{questionStats.highest.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Lowest</span>
                                    <span className="text-xl font-bold">{questionStats.lowest.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Median</span>
                                    <span className="text-xl font-bold">{questionStats.median.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground">Std Dev</span>
                                    <span className="text-xl font-bold">{questionStats.standardDeviation.toFixed(2)}</span>
                                </div>
                                {correctRate !== null && (
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">Correct Rate</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Progress value={correctRate} className="h-2 w-[60px]" />
                                            <span className="font-bold">{correctRate.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Student answers list */}
                        <ScrollArea className="flex-1 border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Result</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentAnswers.map((answer, index) => {
                                        const questionDef = getQuestionDef(answer.question.questionId);
                                        const isObjective = answer.questionType === 'multiple-choice' || answer.questionType === 'fill-in-blank';
                                        const isCorrect = isObjective &&
                                            answer.question.score === (questionDef?.score || 0);

                                        return (
                                            <TableRow
                                                key={`${answer.student.studentId}-${index}`}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => handleViewStudentAnswer(answer)}
                                            >
                                                <TableCell className="font-medium">{answer.student.name}</TableCell>
                                                <TableCell>
                                                    {answer.question.score} / {questionDef?.score || 0}
                                                </TableCell>
                                                <TableCell>
                                                    {isObjective ? (
                                                        <div className="flex items-center">
                                                            {isCorrect ? (
                                                                <CircleCheck className="h-5 w-5 text-green-500 mr-1" />
                                                            ) : (
                                                                <CircleX className="h-5 w-5 text-red-500 mr-1" />
                                                            )}
                                                            {isCorrect ? "Correct" : "Incorrect"}
                                                        </div>
                                                    ) : "Subjective"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewStudentAnswer(answer);
                                                        }}
                                                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                ) : (
                    // Student detail view
                    <div className="flex flex-col space-y-4 overflow-hidden">
                        <button
                            onClick={handleBackToList}
                            className="text-blue-600 hover:text-blue-800 self-start mb-2"
                        >
                            ← Back to all students
                        </button>

                        {selectedStudent && (
                            <Tabs defaultValue="answer" className="flex-1 flex flex-col overflow-hidden">
                                <TabsList className="self-start">
                                    <TabsTrigger value="answer">Answer</TabsTrigger>
                                    <TabsTrigger value="details">Details</TabsTrigger>
                                </TabsList>

                                <TabsContent value="answer" className="flex-1 overflow-auto mt-4">
                                    <Card>
                                        <CardHeader className="py-4">
                                            <CardTitle className="text-base">
                                                {selectedStudent.student.name}&apos;s Answer
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pb-4 space-y-4">
                                            <div className="aspect-auto max-h-80 overflow-hidden rounded-md border">
                                                {selectedStudent.question.imageUrl && (
                                                    <Image
                                                        src={`${IMAGE_PREFIX}/${selectedStudent.question.imageUrl}`}
                                                        alt="Student answer"
                                                        width={800}
                                                        height={600}
                                                        className="object-contain"
                                                    />
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <h4 className="font-medium mb-2">Score</h4>
                                                    <p>{selectedStudent.question.score} / {getQuestionDef(selectedStudent.question.questionId)?.score || 0}</p>
                                                </div>

                                                {selectedStudent.questionType === 'open' && 'aiSuggestion' in selectedStudent.question && (
                                                    <div>
                                                        <h4 className="font-medium mb-2">AI Suggested Score</h4>
                                                        <p>
                                                            {!selectedStudent.question.aiSuggestion ?
                                                                "AI analysis not available" :
                                                                (selectedStudent.question.aiSuggestion.score === -1 ?
                                                                    "AI analysis not available" :
                                                                    (selectedStudent.question.aiSuggestion.score || 'N/A'))}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="details" className="flex-1 overflow-auto mt-4">
                                    <Card>
                                        <CardHeader className="py-4">
                                            <CardTitle className="text-base">
                                                Detailed Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pb-4">
                                            {selectedStudent.questionType === 'multiple-choice' ? (
                                                // Objective question details
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="font-medium mb-2">AI Recognition Result</h4>
                                                        <p className="font-mono p-2 bg-muted rounded-md">
                                                            {('studentAnswer' in selectedStudent.question) &&
                                                                (selectedStudent.question.studentAnswer.length > 0 ?
                                                                    selectedStudent.question.studentAnswer.join(', ') :
                                                                    'No answer detected')}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-medium mb-2">Recognition Status</h4>
                                                        <p>
                                                            {('llmUnknown' in selectedStudent.question) && selectedStudent.question.llmUnknown
                                                                ? 'AI was unable to recognize the answer accurately'
                                                                : 'AI successfully recognized the answer'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Subjective question details
                                                <div className="space-y-4">
                                                    {('aiSuggestion' in selectedStudent.question) && (
                                                        <>
                                                            <div>
                                                                <h4 className="font-medium mb-2">OCR Result</h4>
                                                                <ScrollArea className="h-32 border rounded-md p-2">
                                                                    <p className="whitespace-pre-wrap">
                                                                        {!selectedStudent.question.aiSuggestion ?
                                                                            "AI analysis not available" :
                                                                            (selectedStudent.question.aiSuggestion.score === -1 ?
                                                                                "AI analysis not available" :
                                                                                (selectedStudent.question.aiSuggestion.ocrResult || 'No OCR result available'))}
                                                                    </p>
                                                                </ScrollArea>
                                                            </div>

                                                            <div>
                                                                <h4 className="font-medium mb-2">AI Assessment</h4>
                                                                <ScrollArea className="h-32 border rounded-md p-2">
                                                                    <p className="whitespace-pre-wrap">
                                                                        {!selectedStudent.question.aiSuggestion ?
                                                                            "AI analysis not available" :
                                                                            (selectedStudent.question.aiSuggestion.score === -1 ?
                                                                                "AI analysis not available" :
                                                                                (selectedStudent.question.aiSuggestion.reasoning || 'No assessment available'))}
                                                                    </p>
                                                                </ScrollArea>
                                                            </div>

                                                            <div>
                                                                <h4 className="font-medium mb-2">Grading Suggestion</h4>
                                                                <ScrollArea className="h-32 border rounded-md p-2">
                                                                    <p className="whitespace-pre-wrap">
                                                                        {!selectedStudent.question.aiSuggestion ?
                                                                            "AI analysis not available" :
                                                                            (selectedStudent.question.aiSuggestion.score === -1 ?
                                                                                "AI analysis not available" :
                                                                                (selectedStudent.question.aiSuggestion.suggestion || 'No suggestion available'))}
                                                                    </p>
                                                                </ScrollArea>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
} 