import { Exam } from "@/types/exam";
import { nanoid } from "nanoid";

export const defaultExamData: Exam = {
    id: nanoid(),
    title: 'Sample Exam',
    description: 'Final examination for the Cloud Computing module.',
    duration: '3 HOURS',
    university: 'University College Dublin',
    course: 'COMP3030 Algorithms',
    year: '2024-2025',
    semester: 'Spring',
    examDate: '2024-01-01', // 精确到日
    components: [
        {
            id: nanoid(),
            type: 'default-header',
        },
        {
            id: nanoid(),
            type: 'multiple-choice',
            score: 10,
            questionNumber: 1,
            question: '<p>What&nbsp;is&nbsp;the&nbsp;derivative&nbsp;of&nbsp;the&nbsp;function&nbsp;<span class="latex-formula">f(x) = 3x^4 - 5x^3 + 2x - 7</span>&nbsp; ${input}</p>',
            options: [
                {
                    label: 'A',
                    content: '<p><span class="latex-formula">12x^3 - 15x^2 + 2</span>&nbsp;</p>'
                },
                {
                    label: 'B',
                    content: '<p><span class="latex-formula">12x^3 - 15x^2 + 2x</span>&nbsp;</p>'
                },
                {
                    label: 'C',
                    content: '<p><span class="latex-formula">12x^3 - 15x^2 - 5</span>&nbsp;</p>'
                },
                {
                    label: 'D',
                    content: '<p><span class="latex-formula">12x^3 - 15x^2 + 2x - 7</span>&nbsp;</p>'
                }
            ],
            answer: ['A']
        },
        {
            id: nanoid(),
            type: 'open',
            score: 10,
            questionNumber: 2,
            content: '<p>Describe the main features of the cloud computing model.</p>',
            answer: 'The main features of the cloud computing model are: ...',
            lines: 10
        },
        {
            id: nanoid(),
            type: 'fill-in-blank',
            score: 5,
            questionNumber: 3,
            content: '<p>The library is a quiet place where people can ${input} and enjoy reading.</p>',
            answer: 'dance'
        },
    ]
}