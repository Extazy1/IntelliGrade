import { ExamQuestionStatistics, ObjectiveQuestion, SubjectiveQuestion, Student } from "@/types/types";
import { ExamResponse } from "@/types/exam";

export interface StudentAnswer {
    student: Student;
    question: ObjectiveQuestion | SubjectiveQuestion;
    questionType: 'multiple-choice' | 'fill-in-blank' | 'open';
}

export interface QuestionDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    questionStats: ExamQuestionStatistics;
    questionIndex: number;
    studentAnswers: StudentAnswer[];
    exam: ExamResponse;
} 