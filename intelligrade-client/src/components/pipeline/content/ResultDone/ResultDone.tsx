import { ResultDoneProps } from "./interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OverallStats } from "./components/OverallStats";
import { QuestionStats } from "./components/QuestionStats";
import { ScoreDistribution } from "./components/ScoreDistribution";

export default function ResultDone({ schedule }: ResultDoneProps) {
    const { statistics, studentPapers } = schedule.result;

    return (
        <div className="space-y-4 p-6 pt-0">
            <Card>
                <CardHeader>
                    <CardTitle>Exam Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    <OverallStats statistics={statistics} />
                    <QuestionStats
                        questions={statistics.questions}
                        studentPapers={studentPapers}
                        exam={schedule.exam}
                    />
                </CardContent>
            </Card>
            <ScoreDistribution schedule={schedule} />
        </div>
    );
}