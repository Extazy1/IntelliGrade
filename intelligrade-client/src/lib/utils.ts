import { BaseComponent, UnionComponent } from "@/types/exam"
import { ExamScheduleProgress } from "@/types/types"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function isQuestionComponent(component: BaseComponent) {
    return component.type === 'multiple-choice' || component.type === 'fill-in-blank' || component.type === 'open'
}
