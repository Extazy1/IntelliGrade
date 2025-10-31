import { useState } from "react";
import { ExamQuestionStatistics, ObjectiveQuestion, StudentPaper, SubjectiveQuestion, Student } from "@/types/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { QuestionDetails } from "./QuestionDetails";
import { StudentAnswer } from "./QuestionDetails/interface";
import { ExamResponse } from "@/types/exam";
import { QuestionType } from "@/types/exam";

interface QuestionStatsProps {
    questions: ExamQuestionStatistics[];
    studentPapers: StudentPaper[];
    exam: ExamResponse;
}

export function QuestionStats({ questions, studentPapers, exam }: QuestionStatsProps) {
    const [selectedQuestion, setSelectedQuestion] = useState<{
        stats: ExamQuestionStatistics;
        index: number;
    } | null>(null);

    const handleRowClick = (question: ExamQuestionStatistics, index: number) => {
        setSelectedQuestion({ stats: question, index });
    };

    const handleCloseDialog = () => {
        setSelectedQuestion(null);
    };

    // 确定问题类型，默认为多选题
    const getQuestionType = (type: string | undefined): QuestionType => {
        if (type === 'multiple-choice' || type === 'fill-in-blank' || type === 'open') {
            return type;
        }
        return 'multiple-choice';
    };

    // 准备问题详情对话框中需要的学生答案数据
    const getStudentAnswers = (questionId: string): StudentAnswer[] => {
        const answers: StudentAnswer[] = [];

        studentPapers.forEach((paper) => {
            // 检查客观题
            const objectiveQuestion = paper.objectiveQuestions.find(
                (q) => q.questionId === questionId
            );
            if (objectiveQuestion) {
                // 找到对应的题目定义
                const questionDef = exam.examData.components.find(
                    (component) => component.id === questionId
                );

                answers.push({
                    student: paper.student,
                    question: objectiveQuestion,
                    questionType: getQuestionType(questionDef?.type),
                });
                return;
            }

            // 检查主观题
            const subjectiveQuestion = paper.subjectiveQuestions.find(
                (q) => q.questionId === questionId
            );
            if (subjectiveQuestion) {
                const questionDef = exam.examData.components.find(
                    (component) => component.id === questionId
                );

                // 确保subjectiveQuestion完整传递，包含aiSuggestion字段
                console.log("Found subjective question:", subjectiveQuestion);

                answers.push({
                    student: paper.student,
                    question: { ...subjectiveQuestion },  // 使用对象展开确保所有字段都被复制
                    questionType: getQuestionType(questionDef?.type),
                });
            }
        });

        // 日志输出，方便调试
        console.log("Student answers data:", answers);
        return answers;
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Question Analysis</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead>Average</TableHead>
                        <TableHead>Highest</TableHead>
                        <TableHead>Lowest</TableHead>
                        <TableHead>Median</TableHead>
                        <TableHead>Std Dev</TableHead>
                        <TableHead>Correct Rate</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {questions.map((question, index) => {
                        const correctRate = question.correct !== undefined && question.incorrect !== undefined
                            ? (question.correct / (question.correct + question.incorrect)) * 100
                            : null;

                        return (
                            <TableRow
                                key={question.questionId}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleRowClick(question, index)}
                            >
                                <TableCell>Q{index + 1}</TableCell>
                                <TableCell>{question.average.toFixed(2)}</TableCell>
                                <TableCell>{question.highest.toFixed(2)}</TableCell>
                                <TableCell>{question.lowest.toFixed(2)}</TableCell>
                                <TableCell>{question.median.toFixed(2)}</TableCell>
                                <TableCell>{question.standardDeviation.toFixed(2)}</TableCell>
                                <TableCell>
                                    {correctRate !== null ? (
                                        <div className="flex items-center gap-2">
                                            <Progress value={correctRate} className="w-[60px]" />
                                            <span>{correctRate.toFixed(1)}%</span>
                                        </div>
                                    ) : (
                                        "N/A"
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {selectedQuestion && (
                <QuestionDetails
                    isOpen={!!selectedQuestion}
                    onClose={handleCloseDialog}
                    questionStats={selectedQuestion.stats}
                    questionIndex={selectedQuestion.index}
                    studentAnswers={getStudentAnswers(selectedQuestion.stats.questionId)}
                    exam={exam}
                />
            )}
        </div>
    );
} 