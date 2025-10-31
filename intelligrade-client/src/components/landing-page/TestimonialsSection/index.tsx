import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { defaultTestimonialsData } from "../helpers";
import { TestimonialsSectionProps } from "../types";

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
    testimonialsData = defaultTestimonialsData,
}) => {
    return (
        <section className="w-full py-10">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center text-center mb-4 backdrop-blur-[2px] bg-background/40 rounded-lg p-6">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
                        Trusted by Educators
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-3xl">
                        See how IntelliGrade is transforming assessment processes in educational institutions
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonialsData.map((testimonial, index) => (
                        <Card key={index} className="bg-background">
                            <CardContent className="pt-6">
                                <div className="flex flex-col gap-4">
                                    <p className="italic text-muted-foreground">&quot;{testimonial.content}&quot;</p>
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-secondary">
                                            {testimonial.avatar && (
                                                <Image
                                                    src={testimonial.avatar}
                                                    alt={testimonial.author}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{testimonial.author}</p>
                                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection; 