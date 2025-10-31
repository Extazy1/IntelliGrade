import { ExamScheduleResult } from "@/types/types";

export const defaultScheduleResult: ExamScheduleResult = {
    progress: 'CREATED',
    papers: [],
    studentPapers: [],
    pdfUrl: '',
    matchResult: {
        done: false,
        matched: [],
        unmatched: {
            studentIds: [],
            papers: []
        }
    },
    statistics: {
        average: -1,
        highest: -1,
        lowest: -1,
        median: -1,
        standardDeviation: -1,
        questions: []
    },
    error: null,
}
