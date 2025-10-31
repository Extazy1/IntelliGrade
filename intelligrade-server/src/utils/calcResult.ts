import { ExamSchedule, ObjectiveQuestion, StudentPaper, SubjectiveQuestion } from "../../types/type";
import { ExamResponse, QuestionType, MultipleChoiceQuestionData } from "../../types/exam";
import { ExamQuestionStatistics } from "../../types/type";
import { ensureScheduleResult, serialiseScheduleResult } from "./tools";

// 计算分数
export async function calcResult(documentId: string) {
    // 1. 先通过documentId获得schedule
    const scheduleData = await strapi.documents('api::schedule.schedule').findOne({
        documentId,
        populate: ['exam', 'class', 'teacher']
    });
    const schedule = scheduleData as unknown as ExamSchedule;
    schedule.result = ensureScheduleResult(schedule.result);
    const exam = schedule.exam as unknown as ExamResponse;

    // 初始化数据结构
    schedule.result.statistics = {
        questions: [],
        average: 0,
        highest: 0,
        lowest: 0,
        median: 0,
        standardDeviation: 0,
    }

    // 先等两秒,没有理由,假装在加载
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Calculating result...');

    // 2. 遍历每一个学生的答题结果
    schedule.result.studentPapers.forEach((studentPaper, index) => {
        let totalScore = 0;
        // 2.1 计算客观题分数
        studentPaper.objectiveQuestions.forEach((objectiveQuestion) => {
            totalScore += objectiveQuestion.score;
        });
        // 2.2 计算主观题分数
        studentPaper.subjectiveQuestions.forEach((subjectiveQuestion) => {
            totalScore += subjectiveQuestion.score;
        });
        // 2.3 更新schedule
        schedule.result.studentPapers[index].totalScore = totalScore;
    });

    // 3. 计算其他数据
    const averageScore = schedule.result.studentPapers.reduce((acc, studentPaper) => acc + studentPaper.totalScore, 0) / schedule.result.studentPapers.length;
    const highestScore = Math.max(...schedule.result.studentPapers.map((studentPaper) => studentPaper.totalScore));
    const lowestScore = Math.min(...schedule.result.studentPapers.map((studentPaper) => studentPaper.totalScore));
    const medianScore = schedule.result.studentPapers.sort((a, b) => a.totalScore - b.totalScore)[Math.floor(schedule.result.studentPapers.length / 2)].totalScore;
    const standardDeviation = Math.sqrt(schedule.result.studentPapers.reduce((acc, studentPaper) => acc + Math.pow(studentPaper.totalScore - averageScore, 2), 0) / schedule.result.studentPapers.length);

    // 4. 计算每个题目的数据
    const questionsStatistics: ExamQuestionStatistics[] = [];

    // 辅助函数：从学生试卷中查找特定题目的分数
    const findQuestionScore = (studentPaper: StudentPaper, questionId: string): number => {
        const obj = studentPaper.objectiveQuestions.find(
            (q: ObjectiveQuestion) => q.questionId === questionId
        );
        const subj = studentPaper.subjectiveQuestions.find(
            (q: SubjectiveQuestion) => q.questionId === questionId
        );
        if (obj) {
            return obj.score;
        }
        if (subj) {
            return subj.score;
        }
        throw new Error('Question score not found');
    };

    exam.examData.components.forEach((component) => {
        const allQuestionsType: QuestionType[] = ['multiple-choice', 'fill-in-blank', 'open'];
        if (allQuestionsType.includes(component.type as QuestionType)) {
            const average = schedule.result.studentPapers.reduce(
                (acc, studentPaper) => acc + findQuestionScore(studentPaper, component.id), 0
            ) / schedule.result.studentPapers.length;
            const scores = schedule.result.studentPapers.map(
                studentPaper => findQuestionScore(studentPaper, component.id)
            );
            const highest = Math.max(...scores);
            const lowest = Math.min(...scores);
            const sortedScores = [...scores].sort((a, b) => a - b);
            const median = sortedScores[Math.floor(scores.length / 2)];
            const standardDeviation = Math.sqrt(
                scores.reduce((acc, score) => acc + Math.pow(score - average, 2), 0) / scores.length
            );

            const data: ExamQuestionStatistics = {
                questionId: component.id,
                average,
                highest,
                lowest,
                median,
                standardDeviation,
                correct: -1,
                incorrect: -1,
            }

            if (component.type === 'multiple-choice') {
                const currentQuestion = exam.examData.components.find(
                    (comp) => comp.id === component.id
                ) as MultipleChoiceQuestionData;

                data.correct = schedule.result.studentPapers.reduce(
                    (acc, studentPaper) => acc + (findQuestionScore(studentPaper, component.id) === currentQuestion.score ? 1 : 0),
                    0
                );
                data.incorrect = schedule.result.studentPapers.length - data.correct;
            }
            questionsStatistics.push(data);
        }
    });

    // 5. 更新schedule
    schedule.result.statistics.average = averageScore;
    schedule.result.statistics.highest = highestScore;
    schedule.result.statistics.lowest = lowestScore;
    schedule.result.statistics.median = medianScore;
    schedule.result.statistics.standardDeviation = standardDeviation;
    schedule.result.statistics.questions = questionsStatistics;

    // 6. 更新schedule
    schedule.result.progress = 'RESULT_DONE'; // 设置为完成
    await strapi.documents('api::schedule.schedule').update({
        documentId,
        data: {
            result: serialiseScheduleResult(schedule.result)
        }
    });
    console.log('Result calculated');
}
