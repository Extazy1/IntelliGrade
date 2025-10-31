import React from "react";
import { UploadedProps } from "./interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Uploaded: React.FC<UploadedProps> = ({
    onStartPipeline
}) => {
    return (
        <Card className="w-full max-w-3xl mx-auto shadow-none">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pipeline Ready to Start</CardTitle>
                <CardDescription>
                    Your PDF has been uploaded successfully and is ready for processing
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-6 text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-12 h-12 mx-auto mb-4 text-green-500"
                    >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M12 18v-6" />
                        <path d="M9 15h6" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">PDF Successfully Uploaded</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        The AI is ready to analyze your exam papers and help with the marking process
                    </p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button size="lg" onClick={onStartPipeline}>
                    Start Pipeline Process
                </Button>
            </CardFooter>
        </Card>
    );
};

export default Uploaded; 