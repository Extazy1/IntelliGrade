import { ExamStatistics, StudentPaper } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";

interface ScoreDistributionProps {
    schedule: {
        result: {
            statistics: ExamStatistics;
            studentPapers: StudentPaper[];
        }
    };
}

export function ScoreDistribution({ schedule }: ScoreDistributionProps) {
    const { statistics, studentPapers } = schedule.result;

    // Calculate score ranges
    const calculateScoreRanges = () => {
        const scores = studentPapers.map(paper => paper.totalScore) || [];
        const ranges = [
            { range: '0-20', count: 0 },
            { range: '21-40', count: 0 },
            { range: '41-60', count: 0 },
            { range: '61-80', count: 0 },
            { range: '81-100', count: 0 },
        ];

        scores.forEach((score: number) => {
            if (score <= 20) ranges[0].count++;
            else if (score <= 40) ranges[1].count++;
            else if (score <= 60) ranges[2].count++;
            else if (score <= 80) ranges[3].count++;
            else ranges[4].count++;
        });

        return ranges;
    };

    // Calculate quartile data for visualization
    const calculateQuartileData = () => {
        const scores = studentPapers.map(paper => paper.totalScore).sort((a, b) => a - b);
        const q1 = scores[Math.floor(scores.length * 0.25)] || 0;
        const q3 = scores[Math.floor(scores.length * 0.75)] || 0;

        return [
            { name: 'Min', value: statistics.lowest },
            { name: 'Q1', value: q1 },
            { name: 'Median', value: statistics.median },
            { name: 'Q3', value: q3 },
            { name: 'Max', value: statistics.highest },
        ];
    };

    // Calculate student rankings
    const calculateRankings = () => {
        return studentPapers
            .map(paper => ({
                name: paper.student.name,
                studentId: paper.student.studentId,
                score: paper.totalScore,
            }))
            .sort((a, b) => b.score - a.score);
    };

    const scoreRanges = calculateScoreRanges();
    const quartileData = calculateQuartileData();
    const rankings = calculateRankings();

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-lg font-medium mb-4">Score Distribution</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={scoreRanges}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="range" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Number of Students" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-lg font-medium mb-4">Score Quartile</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={quartileData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Student Rankings</h3>
                    <div className="max-h-[400px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Rank</TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Student ID</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rankings.map((student, index) => (
                                    <TableRow key={student.studentId}>
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>{student.studentId}</TableCell>
                                        <TableCell className="text-right">{student.score.toFixed(1)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 