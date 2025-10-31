"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection: React.FC = () => {
    return (
        <section className="w-full py-14 relative">
            <div className="absolute inset-0 bg-primary opacity-90 z-0"></div>
            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4 text-primary-foreground">
                        Ready to Transform Your Exam Process?
                    </h2>
                    <p className="text-primary-foreground/80 text-lg max-w-3xl mb-8">
                        Join educational institutions worldwide that are using IntelliGrade to streamline assessment workflows and gain valuable insights.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            size="lg"
                            variant="secondary"
                            asChild
                            className="bg-background text-primary hover:bg-background/90"
                        >
                            <a href="/dashboard">
                                Get Started Now
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            asChild
                            className="border-primary-foreground/20 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 hover:border-primary-foreground/30 hover:text-primary-foreground transition-colors"
                        >
                            <a href="/dashboard">
                                Request a Demo
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTASection; 