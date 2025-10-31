import React from "react";
import { DoneProps } from "./interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Done: React.FC<DoneProps> = ({
    examId,
    pipelineStats,
    onViewResults,
    onGoToDashboard
}) => {
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <Card className="w-full max-w-3xl mx-auto shadow-lg">
            <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-8 h-8 text-green-600"
                    >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <CardTitle className="text-2xl">Pipeline Completed Successfully!</CardTitle>
                <CardDescription>
                    Your exam has been processed and is ready for review and grading
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                        <p className="text-2xl font-bold">{pipelineStats.totalStudents}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Total Questions</p>
                        <p className="text-2xl font-bold">{pipelineStats.totalQuestions}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Processing Time</p>
                        <p className="text-2xl font-bold">{formatTime(pipelineStats.processingTime)}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Match Rate</p>
                        <p className="text-2xl font-bold">{pipelineStats.matchRate}%</p>
                    </div>
                </div>

                <div className="border rounded-lg p-6 bg-green-50">
                    <h3 className="font-medium text-lg mb-3 text-green-800">Whats Next?</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5 text-green-600 mt-0.5"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span className="text-green-800">Review and grade student answers with AI assistance</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5 text-green-600 mt-0.5"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span className="text-green-800">Generate detailed analytics and reports</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5 text-green-600 mt-0.5"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span className="text-green-800">Export grades and feedback for your students</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-medium">Exam ID: {examId}</p>
                        <p className="text-sm text-muted-foreground">
                            Keep this ID for reference
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(examId);
                    }}>
                        Copy ID
                    </Button>
                </div>
            </CardContent>
            <Separator />
            <CardFooter className="flex justify-between pt-6">
                <Button variant="outline" onClick={onGoToDashboard}>
                    Return to Dashboard
                </Button>
                <Button onClick={onViewResults}>
                    View Results
                </Button>
            </CardFooter>
        </Card>
    );
};

export default Done; 