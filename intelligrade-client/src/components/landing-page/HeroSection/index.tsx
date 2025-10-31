"use client";

import React from "react";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection: React.FC = () => {
    return (
        <section className="relative w-full py-12 md:py-20">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center text-center max-w-5xl mx-auto backdrop-blur-[2px] bg-background/40 rounded-lg p-8">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-4">
                        IntelliGrade - The Future of Smart Exam Management is Here
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl">
                        Empower Your Team, Streamline Your Processes, And Boost Educational Outcomes With Our Exam Management Platform
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="default" className="px-6 py-2 h-auto">
                            <a href="/dashboard" >
                                Get Started
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                        <Button asChild size="default" variant="outline" className="px-6 py-2 h-auto border-[#e5e7eb]">
                            <a href="/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection; 