import { Class, ExamSchedule } from "@/types/types";
import { Dispatch } from "react";
import { SetStateAction } from "react";

export interface MatchDoneProps {
    schedule: ExamSchedule;
    classData: Class;
    setSchedule: Dispatch<SetStateAction<ExamSchedule | null>>
}