"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResultStartProps } from "./interface";

const loadingMessages = [
    "Calculating final scores",
    "Processing student answers",
    "Generating performance analytics",
    "Evaluating answer quality",
    "Applying grading criteria",
    "Compiling feedback for teachers",
    "Summarizing assessment results",
    "AI-assisted score calculation in progress"
];

export default function ResultStart({ updateSchedule }: ResultStartProps) {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex((prevIndex) =>
                (prevIndex + 1) % loadingMessages.length
            );
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            // 轮询接口,等待状态更新
            updateSchedule();
        }, 500);
        return () => clearInterval(interval);
    }, [updateSchedule]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center space-y-12 max-w-md text-center">
                <div className="relative">
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                </div>

                <div className="space-y-8 w-full">
                    <div className="h-[60px] relative overflow-hidden">
                        {loadingMessages.map((message, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "absolute w-full transition-all duration-500 ease-in-out",
                                    index === currentMessageIndex
                                        ? "opacity-100 translate-y-0"
                                        : "opacity-0 translate-y-8"
                                )}
                            >
                                <p className="text-xl font-medium text-foreground">
                                    {message}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 