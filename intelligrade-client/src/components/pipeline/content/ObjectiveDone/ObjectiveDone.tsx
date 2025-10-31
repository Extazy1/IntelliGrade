import { ObjectiveDoneProps } from "./interface";
import { useState, useRef, useEffect } from "react";
import ResultDialog from "./ResultDialog";
import LastOneDialog from "./LastOneDialog";
import QuestionReview from "./QuestionReview";
import { ExamSchedule } from "@/types/types";
import { ExamResponse, MultipleChoiceQuestionData } from "@/types/exam";
import { ExtendedObjectiveQuestion } from "./interface";
import { updateExamSchedule, startSubjective } from "@/lib/api";
import AllQuestionsFlow from "./AllQuestionsFlow";
import cloneDeep from "lodash/cloneDeep";

function getQuestionByQuestionId(questionId: string, schedule: ExamSchedule) {
    const exam = schedule.exam as ExamResponse;
    return exam.examData.components.find((component) => component.id === questionId) as MultipleChoiceQuestionData;
}

export default function ObjectiveDone({ schedule, setSchedule }: ObjectiveDoneProps) {
    const [openResultDialog, setOpenResultDialog] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [openLastOneDialog, setOpenLastOneDialog] = useState(false);
    const allQuestionNum = schedule.result.studentPapers.reduce((acc, paper) => acc + paper.objectiveQuestions.length, 0);
    const failedQuestionNumRef = useRef(0);

    // 计算所有识别失败的题目数量
    useEffect(() => {
        const failedQuestionNum = schedule.result.studentPapers.reduce((acc, paper) => acc + paper.objectiveQuestions.filter((question) => question.llmUnknown).length, 0);
        failedQuestionNumRef.current = failedQuestionNum;
    }, [schedule]);

    const successQuestionNum = allQuestionNum - failedQuestionNumRef.current;
    // 所有识别失败的题目
    const [failedQuestions, setFailedQuestions] = useState<ExtendedObjectiveQuestion[]>(
        schedule.result.studentPapers.flatMap((paper) =>
            paper.objectiveQuestions
                .filter((question) => question.llmUnknown)
                .map((question) => ({
                    ...question,
                    studentId: paper.student.studentId
                }))
        )
    );
    // 处理完的识别失败的题目
    const [markedFailedQuestions, setMarkedFailedQuestions] = useState<ExtendedObjectiveQuestion[]>([]);
    // 当前处理的题目
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const notingToDo = failedQuestionNumRef.current === 0 || markedFailedQuestions.length === failedQuestions.length;

    const handlePrevious = () => {
        setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentQuestionIndex((prev) => Math.min(failedQuestionNumRef.current - 1, prev + 1));
    };

    // 标记为正确
    const handleMarkCorrect = async () => {
        setIsLoading(true);
        const currentQuestion = failedQuestions[currentQuestionIndex];
        const questionDef = getQuestionByQuestionId(currentQuestion.questionId, schedule);
        currentQuestion.score = questionDef.score; // 设置为满分
        currentQuestion.llmUnknown = false; // 设置为已识别
        // 更新schedule数据
        schedule.result.studentPapers = schedule.result.studentPapers.map((paper) => {
            if (paper.student.studentId === currentQuestion.studentId) {
                return {
                    ...paper,
                    objectiveQuestions: paper.objectiveQuestions.map((question) => question.questionId === currentQuestion.questionId ? currentQuestion : question)
                }
            }
            return paper;
        })
        // 上传到数据库
        await updateExamSchedule(schedule.documentId, { result: schedule.result });
        setMarkedFailedQuestions([...markedFailedQuestions, currentQuestion]);
        setIsLoading(false);
        // Move to next question if not at the end
        if (currentQuestionIndex < failedQuestionNumRef.current - 1) {
            handleNext();
        }
        if (markedFailedQuestions.length + 1 === failedQuestions.length) {
            console.log('all done')
            handleLastOne()
        }
    };

    // 标记为错误
    const handleMarkIncorrect = async () => {
        setIsLoading(true);
        const currentQuestion = failedQuestions[currentQuestionIndex];
        currentQuestion.score = 0; // 设置为0分
        currentQuestion.llmUnknown = false; // 设置为已识别

        // 更新schedule数据
        schedule.result.studentPapers = schedule.result.studentPapers.map((paper) => {
            if (paper.student.studentId === currentQuestion.studentId) {
                return {
                    ...paper,
                    objectiveQuestions: paper.objectiveQuestions.map((question) =>
                        question.questionId === currentQuestion.questionId ? currentQuestion : question
                    )
                }
            }
            return paper;
        });

        // 上传到数据库
        await updateExamSchedule(schedule.documentId, { result: schedule.result });
        setMarkedFailedQuestions([...markedFailedQuestions, currentQuestion]);
        setIsLoading(false);
        // Move to next question if not at the end
        if (currentQuestionIndex < failedQuestionNumRef.current - 1) {
            handleNext();
        }
        if (markedFailedQuestions.length + 1 === failedQuestions.length) {
            console.log('all done')
            handleLastOne()
        }
    };

    // Calculate progress
    const progress = (markedFailedQuestions.length / failedQuestionNumRef.current) * 100;

    const handleLastOne = () => {
        // 如果当前是最后一道题，则跳一个弹窗
        setOpenLastOneDialog(true);
    }

    // 进入 SUBJECTIVE_START 步骤
    const handleNextStep = async () => {
        schedule.result.progress = 'SUBJECTIVE_START';
        // 更新schedule
        await updateExamSchedule(schedule.documentId, { result: schedule.result });
        // 刷新页面状态
        setSchedule(cloneDeep(schedule));
        // 开始主观题流水线
        await startSubjective(schedule.documentId);
    };

    return (
        <>
            <div className="w-full h-full">
                {notingToDo ? (
                    <AllQuestionsFlow handleNextStep={handleNextStep} schedule={schedule} />
                ) : (
                    <QuestionReview
                        question={failedQuestions[currentQuestionIndex]}
                        definedQuestion={getQuestionByQuestionId(failedQuestions[currentQuestionIndex].questionId, schedule)}
                        onMarkCorrect={handleMarkCorrect}
                        onMarkIncorrect={handleMarkIncorrect}
                        onPrevious={handlePrevious}
                        onNext={handleNext}
                        progress={progress}
                        isLoading={isLoading}
                        total={failedQuestionNumRef.current}
                        finished={markedFailedQuestions.length}
                    />
                )}
            </div>
            <ResultDialog
                open={openResultDialog}
                onOpenChange={setOpenResultDialog}
                allQuestionNum={allQuestionNum}
                successQuestionNum={successQuestionNum}
                failedQuestionNum={failedQuestionNumRef.current}
            />
            <LastOneDialog
                open={openLastOneDialog}
                onOpenChange={setOpenLastOneDialog}
                onNextStep={() => setOpenLastOneDialog(false)}
            />
        </>
    );
}