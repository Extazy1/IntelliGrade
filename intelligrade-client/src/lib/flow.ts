import { Class, ExamSchedule } from "@/types/types";
import { IMAGE_PREFIX } from "./host";

export const BIGGER_HANDLE_STYLE = {
    width: 10,
    height: 10,
}

export function generatePaperNodes(schedule: ExamSchedule) {
    return schedule.result.papers.map((paper) => ({
        id: paper.paperId,
        type: 'paper',
        data: {
            imageUrl: `${IMAGE_PREFIX}/${paper.headerImgUrl}`,
        },
        position: { x: 0, y: 0 },
        deletable: false,
    }));
}

export function generateStudentNodes(classData: Class) {
    return classData.students.map((student) => ({
        id: student.studentId,
        type: 'student',
        data: { studentName: student.name, studentId: student.studentId },
        position: { x: 0, y: 0 },
        deletable: false,
    }));
}

export function generateEdges(schedule: ExamSchedule) {
    return schedule.result.matchResult.matched.map((match) => ({
        id: `${match.paperId}-${match.studentId}`,
        source: match.paperId,
        target: match.studentId,
        animated: true,
        deletable: false,
    }));
}
