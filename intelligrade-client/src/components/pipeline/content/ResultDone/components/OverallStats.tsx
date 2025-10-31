import { ExamStatistics } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Target, Calculator, LineChart } from "lucide-react";

interface OverallStatsProps {
    statistics: ExamStatistics;
}

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value.toFixed(2)}</p>
                </div>
                <div className="text-muted-foreground">{icon}</div>
            </CardContent>
        </Card>
    );
}

export function OverallStats({ statistics }: OverallStatsProps) {
    const stats = [
        {
            title: "Highest Score",
            value: statistics.highest,
            icon: <ArrowUp className="h-6 w-6" />,
        },
        {
            title: "Lowest Score",
            value: statistics.lowest,
            icon: <ArrowDown className="h-6 w-6" />,
        },
        {
            title: "Average Score",
            value: statistics.average,
            icon: <Calculator className="h-6 w-6" />,
        },
        {
            title: "Median Score",
            value: statistics.median,
            icon: <Target className="h-6 w-6" />,
        },
        {
            title: "Standard Deviation",
            value: statistics.standardDeviation,
            icon: <LineChart className="h-6 w-6" />,
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
                <StatCard key={stat.title} {...stat} />
            ))}
        </div>
    );
} 