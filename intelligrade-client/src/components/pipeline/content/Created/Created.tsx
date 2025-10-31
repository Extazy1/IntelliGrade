import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Created: React.FC = () => {
    return (
        <Card className="w-full max-w-3xl mx-auto shadow-none">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pipeline Not Started</CardTitle>
                <CardDescription>
                    You need to upload a PDF file to start the pipeline process
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
                        className="w-12 h-12 mx-auto mb-4 text-muted-foreground"
                    >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M12 18v-6" />
                        <path d="M9 15h6" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">No PDF Uploaded</h3>
                    <p className="text-sm text-muted-foreground">
                        Please navigate to the dashboard to upload your exam PDF file. AI will help you mark student papers.
                    </p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button size="lg">
                    <a href="/dashboard">
                        Go to Dashboard
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
};

export default Created; 