import { ExamSchedule } from "@/types/types";

export interface MatchStartProps {
    updateSchedule: () => Promise<void>;
    schedule: ExamSchedule;
}
