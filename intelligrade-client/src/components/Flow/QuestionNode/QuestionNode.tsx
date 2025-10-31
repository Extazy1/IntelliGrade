import { QuestionNodeProps, StudentAnswer } from "./interface";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { IMAGE_PREFIX } from "@/lib/host";
import { ExamResponse, MultipleChoiceQuestionData } from "@/types/exam";
import Image from "next/image";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CircleCheck, CircleX } from "lucide-react";

export default function QuestionNode({ data }: QuestionNodeProps) {
    const exam = data.schedule.exam as ExamResponse;
    const currentQuestion = exam.examData.components.find((component) => component.id === data.questionId) as MultipleChoiceQuestionData;
    const questionNumber = currentQuestion?.questionNumber;
    const isMCQ = currentQuestion.type === 'multiple-choice';
    // 从 ExamSchedule 中提取学生答案数据
    const studentAnswers: StudentAnswer[] = []
    data.schedule.result.studentPapers.forEach((paper) => {
        // 先找obj
        paper.objectiveQuestions.forEach((question) => {
            if (question.questionId === data.questionId) {
                studentAnswers.push({
                    studentId: paper.student.studentId,
                    studentName: paper.student.name,
                    answer: question.studentAnswer,
                    answerImg: question.imageUrl,
                    score: question.score,
                });
            }
        });
        // 再找sub
        paper.subjectiveQuestions.forEach((question) => {
            if (question.questionId === data.questionId) {
                studentAnswers.push({
                    studentId: paper.student.studentId,
                    studentName: paper.student.name,
                    answer: [''], // placeholder，主观题不展示
                    answerImg: question.imageUrl,
                    score: question.score,
                });
            }
        });
    });

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewStudentName, setPreviewStudentName] = useState<string>("");

    const imagePreview = (imageUrl: string, studentName: string) => {
        setPreviewImage(imageUrl);
        setPreviewStudentName(studentName);
    }

    return (
        <div className="max-w-[2000px]">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Question {questionNumber}</CardTitle>
                    <CardDescription>
                        <ul>
                            {isMCQ && <li>Answer: {currentQuestion.answer}</li>}
                            <li>Points: {currentQuestion.score}</li>
                        </ul>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-6 justify-around">
                    {studentAnswers.map((item) => (
                        <Card key={item.studentId} onClick={() => imagePreview(item.answerImg, item.studentName)} className="flex flex-1 flex-col min-w-[400px] hover:scale-105 transition-all duration-300 cursor-pointer">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-base">{item.studentName}</CardTitle>
                                <CardDescription>ID: {item.studentId}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col items-center justify-center p-4 pt-0">
                                {item.answer && (
                                    <div className="w-full h-[200px] relative">
                                        <Image
                                            src={`${IMAGE_PREFIX}/${item.answerImg}`}
                                            alt={`Answer from ${item.studentName}`}
                                            fill
                                            className="object-contain rounded-md"
                                        />
                                    </div>
                                )}
                                {item.answer && isMCQ && (
                                    <div className="w-full p-2 bg-muted rounded-md">
                                        <p className="text-sm whitespace-pre-wrap">
                                            Answer:  {item.answer.join(', ')}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex border-t pt-4 gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Score:
                                </span>
                                <span className="font-semibold">
                                    {item.score}
                                </span>
                                {isMCQ && (
                                    item.score !== 0 ? <CircleCheck className="w-4 h-4 text-green-500" /> : <CircleX className="w-4 h-4 text-red-500" />
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Student Answer: {previewStudentName}</DialogTitle>
                        <DialogDescription>
                            Click outside or press ESC to close
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative w-full h-[80vh] mt-4">
                        {previewImage && (
                            <Image
                                src={`${IMAGE_PREFIX}/${previewImage}`}
                                alt={`Full size answer from ${previewStudentName}`}
                                fill
                                className="object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}