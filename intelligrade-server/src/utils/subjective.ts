import path from "path";
import { ExamResponse, FillInBlankQuestionData, OpenQuestionData } from "../../types/exam";
import { ExamSchedule, SubjectiveQuestion } from "../../types/type";
import { SubjectiveInput, SubjectiveResult } from "./schema";
import { ensureScheduleResult, serialiseScheduleResult } from "./tools";

const toPosixPath = (...segments: string[]) => path.posix.join(...segments);

export async function startSubjective(documentId: string) {
    console.log(`SUBJECTIVE STARTED FOR ${documentId}`);

    // 1. 先通过documentId获得schedule
    const scheduleData = await strapi.documents('api::schedule.schedule').findOne({
        documentId,
        populate: ['exam', 'class', 'teacher']
    });
    const schedule = scheduleData as unknown as ExamSchedule; //
    schedule.result = ensureScheduleResult(schedule.result);
    const exam = schedule.exam as unknown as ExamResponse;

    // 等1秒,没有理由,假装在加载
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. 筛选出所有的主观题目 OPEN 和 FILL_IN_BLANK
    const subjectiveQuestions = exam.examData.components.filter((component) => {
        return component.type === 'open' || component.type === 'fill-in-blank';
    }) as (OpenQuestionData | FillInBlankQuestionData)[];

    // 3. 遍历每一个学生，创建SubjectiveQuestion
    schedule.result.studentPapers.forEach((studentPaper, index) => {
        // Find the corresponding paper from result.papers to get questionImageMap
        const paper = schedule.result.papers.find(p => p.paperId === studentPaper.paperId);
        
        schedule.result.studentPapers[index].subjectiveQuestions = subjectiveQuestions.map((question) => {
            // Get the actual image path from questionImageMap
            const imageUrl = paper?.questionImageMap?.[question.id] || 
                           toPosixPath('pipeline', schedule.documentId, studentPaper.paperId, 'questions', `${question.id}.png`);
            
            return {
                questionId: question.id,
                score: -1, // 初始分数为-1
                imageUrl,
                done: false,
                aiSuggestion: {
                    reasoning: '',
                    score: -1,
                    ocrResult: '',
                    suggestion: '',
                },
                questionNumber: question.questionNumber,
            };
        });
    });

    // 4. 更新schedule
    schedule.result.progress = 'SUBJECTIVE_DONE'; // 更新进度
    await strapi.documents('api::schedule.schedule').update({
        documentId,
        data: {
            result: serialiseScheduleResult(schedule.result),
        },
    });

    console.log(`SUBJECTIVE START FINISHED FOR ${documentId}`);
}
