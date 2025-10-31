import React from "react";
import Image from "next/image";
import { defaultFeaturesData } from "../helpers";
import { FeaturesSectionProps } from "../types";

const FeaturesSection: React.FC<FeaturesSectionProps> = ({
    featuresData = defaultFeaturesData,
}) => {
    return (
        <section className="w-full py-8 bg-gradient-to-b from-background to-background/50">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
                        Comprehensive Exam Management
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-3xl">
                        IntelliGrade streamlines the entire examination lifecycle through three integrated modules
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuresData.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative flex flex-col overflow-hidden rounded-xl bg-card dark:bg-card border border-border dark:border-border shadow-sm transition-all hover:shadow-md hover:-translate-y-1 duration-300"
                        >
                            <div className="relative aspect-[16/9] w-full overflow-hidden">
                                <Image
                                    src={feature.imageUrl || `/images/feature-${index + 1}.jpg`}
                                    alt={feature.title}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105 duration-500"
                                />
                            </div>
                            <div className="p-6">
                                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground text-base">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection; 