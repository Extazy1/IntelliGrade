import { useState, useCallback, useEffect, cache } from "react";
import { SubjectiveDoneProps, ExtendedSubjectiveQuestion, AiCache } from "./interface";
import QuestionSidebar from "./QuestionSidebar";
import QuestionContent from "./QuestionContent";
import AiSuggestion from "./AiSuggestion";
import { ExamSchedule, SubjectiveQuestion, SubjectiveLLMResponse, LLMSubjectiveInput } from "@/types/types";
import { OpenQuestionData } from "@/types/exam";
import { ExamResponse } from "@/types/exam";
import { updateExamSchedule, getSubjectiveLLMResponse, startResult } from "@/lib/api";
import { cloneDeep } from "lodash";

export default function SubjectiveDone({
    schedule,
    setSchedule
}: SubjectiveDoneProps) {
    // 内部状态管理
    const [subjectiveQuestions, setSubjectiveQuestions] = useState<ExtendedSubjectiveQuestion[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<ExtendedSubjectiveQuestion | null>(null);
    const [aiSuggestion, setAiSuggestion] = useState<SubjectiveLLMResponse | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [aiCache, setAiCache] = useState<AiCache[]>([]);
    const [isLoadingContinue, setIsLoadingContinue] = useState(false);

    // 计算进度
    const totalQuestions = subjectiveQuestions.length;
    const finishedQuestions = subjectiveQuestions.filter(q => q.done).length;
    const progress = totalQuestions > 0 ? (finishedQuestions / totalQuestions) * 100 : 0;

    // 初始化数据
    useEffect(() => {
        if (!schedule) return;

        // 提取所有学生的主观题答案
        const questions: ExtendedSubjectiveQuestion[] = schedule.result.studentPapers.flatMap(paper => {
            return paper.subjectiveQuestions.map(q => ({
                ...q,
                studentId: paper.student.studentId
            }));
        });

        // 按照问题的顺序,而不是学生的顺序
        const sortedQuestions = questions.sort((a, b) => getQuestionDef(schedule, a.questionId).questionNumber - getQuestionDef(schedule, b.questionId).questionNumber);

        setSubjectiveQuestions(sortedQuestions);
        const firstUnfinishedQuestion = sortedQuestions.find(q => !q.done);
        setCurrentQuestion(firstUnfinishedQuestion || sortedQuestions[0]); // 默认选择第一个问题
    }, [schedule]);

    // 获取AI建议
    useEffect(() => {
        if (!currentQuestion) return;
        // 如果当前问题有缓存,则直接使用缓存
        const remoteCache = currentQuestion.aiSuggestion
        const localCache = aiCache.find(c => c.questionId === currentQuestion.questionId && c.studentId === currentQuestion.studentId);
        // 优先使用远程缓存
        if (remoteCache.score !== -1) {
            setAiSuggestion(remoteCache);
            return;
        } else if (localCache) {
            setAiSuggestion(localCache.aiSuggestion);
            return;
        }
        fetchAiSuggestion(currentQuestion);
    }, [currentQuestion])

    // 获取AI建议
    const fetchAiSuggestion = async (question: ExtendedSubjectiveQuestion) => {
        setIsAiLoading(true);
        const questionDef = getQuestionDef(schedule, question.questionId) as unknown as OpenQuestionData;
        const requestBody: LLMSubjectiveInput = {
            question: questionDef.content,
            answer: questionDef.answer,
            score: questionDef.score,
            imageUrl: question.imageUrl
        }
        const response = await getSubjectiveLLMResponse(requestBody);
        setAiSuggestion(response);
        setIsAiLoading(false)
        // 上传缓存
        schedule.result.studentPapers.forEach((paper, pIndex) => {
            paper.subjectiveQuestions.forEach((q, qIndex) => {
                if (q.questionId === question.questionId && paper.student.studentId === question.studentId) {
                    schedule.result.studentPapers[pIndex].subjectiveQuestions[qIndex].aiSuggestion = response;
                }
            });
        });
        await updateExamSchedule(schedule.documentId, { result: schedule.result });
        setAiCache([...aiCache, { questionId: question.questionId, studentId: question.studentId, aiSuggestion: response }]);
    };

    // 选择问题
    const handleQuestionSelect = useCallback((questionId: string, studentId: string) => {
        const question = subjectiveQuestions.find(q => q.questionId === questionId && q.studentId === studentId) || null;
        setCurrentQuestion(question);
    }, [subjectiveQuestions]);

    // 提交分数
    const handleScoreSubmit = async (score: number) => {
        if (!currentQuestion) return;
        setIsSubmitting(true);
        const sutdentId = currentQuestion.studentId;
        const questionId = currentQuestion.questionId;
        // 更新schedule
        const updatedSchedule = schedule.result.studentPapers.map(paper => {
            if (paper.student.studentId === sutdentId) {
                return {
                    ...paper,
                    subjectiveQuestions: paper.subjectiveQuestions.map(q => q.questionId === questionId ? { ...q, score, done: true } : q)
                }
            }
            return paper;
        });
        schedule.result.studentPapers = updatedSchedule;
        await updateExamSchedule(schedule.documentId, { result: schedule.result });
        setSchedule(cloneDeep(schedule));
        setIsSubmitting(false);
        // 全部完成后
        const allFinished = updatedSchedule.every(paper => paper.subjectiveQuestions.every(q => q.done));
        if (allFinished) {
            // TODO
        }
    };

    // 前一个问题
    const handlePrevious = useCallback(() => {
        if (!currentQuestion) return;

        const currentIndex = subjectiveQuestions.findIndex(
            q => q.questionId === currentQuestion.questionId &&
                q.studentId === currentQuestion.studentId
        );

        if (currentIndex > 0) {
            const prevSQ = subjectiveQuestions[currentIndex - 1];
            setCurrentQuestion(prevSQ);
        }
    }, [currentQuestion, subjectiveQuestions]);

    // 下一个问题
    const handleNext = () => {
        if (!currentQuestion) return;

        const currentIndex = subjectiveQuestions.findIndex(
            q => q.questionId === currentQuestion.questionId && q.studentId === currentQuestion.studentId
        );

        if (currentIndex < subjectiveQuestions.length - 1) {
            const nextQ = subjectiveQuestions[currentIndex + 1];
            setCurrentQuestion(nextQ);
        }
    };

    const handleContinue = async () => {
        setIsLoadingContinue(true);
        schedule.result.progress = 'RESULT_START'; // 开始结果计算
        await updateExamSchedule(schedule.documentId, { result: schedule.result });
        await startResult(schedule.documentId);
        setSchedule(cloneDeep(schedule));
        setIsLoadingContinue(false);
    }

    return (
        <>
            {currentQuestion && (
                <div className="w-full h-full flex">
                    {/* Left sidebar for question selection */}
                    <div className="max-w-60 overflow-hidden">
                        <QuestionSidebar
                            questions={subjectiveQuestions} // 所有问题的序号, id
                            currentQuestion={currentQuestion}
                            onQuestionSelect={handleQuestionSelect}
                            schedule={schedule}
                        />
                    </div>

                    {/* Main content area */}
                    <QuestionContent
                        currentQuestion={currentQuestion}
                        progress={progress}
                        total={totalQuestions}
                        finished={finishedQuestions}
                        onScoreSubmit={handleScoreSubmit}
                        onPrevious={handlePrevious}
                        onNext={handleNext}
                        questionDef={getQuestionDef(schedule, currentQuestion.questionId)}
                        isSubmitting={isSubmitting}
                        handleContinue={handleContinue}
                        isLoadingContinue={isLoadingContinue}
                    />

                    {/* Right sidebar for AI suggestions */}
                    <div className="max-w-96">
                        <AiSuggestion
                            questionDef={getQuestionDef(schedule, currentQuestion.questionId)}
                            aiSuggestion={aiSuggestion}
                            isAiLoading={isAiLoading}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

export function getQuestionDef(schedule: ExamSchedule, componentId: string): SubjectiveQuestion {
    const exam = schedule.exam as ExamResponse;
    const questionDef = exam.examData.components.find((c) => c.id === componentId);
    return questionDef as unknown as SubjectiveQuestion;
}