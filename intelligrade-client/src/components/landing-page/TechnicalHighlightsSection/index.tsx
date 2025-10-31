import React from "react";
import { CheckSquare, Layers, Brain, BarChart } from "lucide-react";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

const TechnicalHighlightsSection = () => {
    return (
        <section className="w-full py-14">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1 order-2 md:order-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <Card className="cursor-pointer transition-all hover:shadow-md">
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-md bg-primary/10">
                                                    <Layers className="h-5 w-5 text-primary" />
                                                </div>
                                                <CardTitle className="text-lg">React Frontend</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription>
                                                Modern UI with mathematical rendering capabilities
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                    <div className="flex flex-col gap-2">
                                        <h4 className="font-medium">React Frontend</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Built with React and Next.js for optimal performance, with integrated LaTeX rendering for mathematical formulas and equations.
                                        </p>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>

                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <Card className="cursor-pointer transition-all hover:shadow-md">
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-md bg-primary/10">
                                                    <Brain className="h-5 w-5 text-primary" />
                                                </div>
                                                <CardTitle className="text-lg">OCR Services</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription>
                                                Optimized for handwritten answers
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                    <div className="flex flex-col gap-2">
                                        <h4 className="font-medium">Advanced OCR</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Specialized optical character recognition algorithms trained on diverse handwriting styles for accurate digitization of student responses.
                                        </p>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>

                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <Card className="cursor-pointer transition-all hover:shadow-md">
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-md bg-primary/10">
                                                    <BarChart className="h-5 w-5 text-primary" />
                                                </div>
                                                <CardTitle className="text-lg">Data Visualization</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription>
                                                Interactive insights for educators
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                    <div className="flex flex-col gap-2">
                                        <h4 className="font-medium">Interactive Visualizations</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Comprehensive data visualization tools that transform assessment data into actionable educational insights through charts, heatmaps, and knowledge graphs.
                                        </p>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>

                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <Card className="cursor-pointer transition-all hover:shadow-md">
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-md bg-primary/10">
                                                    <CheckSquare className="h-5 w-5 text-primary" />
                                                </div>
                                                <CardTitle className="text-lg">Collaborative Grading</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription>
                                                With version control and tracking
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                    <div className="flex flex-col gap-2">
                                        <h4 className="font-medium">Team Grading Environment</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Multi-user grading platform with annotation history, change tracking, and role-based permissions for transparent and efficient assessment workflows.
                                        </p>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        </div>
                    </div>
                    <div className="flex-1 order-1 md:order-2 backdrop-blur-[2px] bg-background/40 rounded-lg p-6">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-6">
                            Technical Highlights
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8">
                            IntelliGrade combines cutting-edge technologies to deliver a seamless and powerful exam management experience.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-2">
                                <div className="rounded-full p-1 bg-primary/10 mt-1">
                                    <CheckSquare className="h-4 w-4 text-primary" />
                                </div>
                                <span>React frontend with mathematical rendering capabilities</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="rounded-full p-1 bg-primary/10 mt-1">
                                    <CheckSquare className="h-4 w-4 text-primary" />
                                </div>
                                <span>Integrated OCR services optimized for handwritten answers</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="rounded-full p-1 bg-primary/10 mt-1">
                                    <CheckSquare className="h-4 w-4 text-primary" />
                                </div>
                                <span>Interactive data visualizations for educational insights</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="rounded-full p-1 bg-primary/10 mt-1">
                                    <CheckSquare className="h-4 w-4 text-primary" />
                                </div>
                                <span>Collaborative grading environment with version control</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TechnicalHighlightsSection; 