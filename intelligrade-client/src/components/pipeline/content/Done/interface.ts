interface PipelineStats {
    totalStudents: number;
    totalQuestions: number;
    processingTime: number;
    matchRate: number;
}

interface DoneProps {
    examId: string;
    pipelineStats: PipelineStats;
    onViewResults: () => void;
    onGoToDashboard: () => void;
}

export type { DoneProps, PipelineStats }; 