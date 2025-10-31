"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signUpSchema } from "./helpers";
import { SignUpFormProps } from "./interface";

type FormData = z.infer<typeof signUpSchema>;

export default function SignUpForm({ initialData, onSubmit }: SignUpFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: initialData?.name || "",
            email: initialData?.email || "",
            password: "",
        },
    });

    const handleFormSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            if (onSubmit) {
                await onSubmit(data);
            } else {
                // This is just for demonstration, in actual integration the parent component should provide onSubmit callback
                console.log("Form submitted:", data);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center w-full min-h-screen p-4">
            <div className="flex w-full  max-w-[1200px] flex-col lg:flex-row gap-8">
                {/* Left side: Image */}
                <div className="hidden lg:flex flex-1 items-center justify-center rounded-lg overflow-hidden bg-muted relative">
                    <Image
                        src="/images/auth/signup-background.jpg"
                        alt="Team collaboration"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20 flex flex-col justify-end p-8 text-white">
                        <h2 className="text-2xl font-bold mb-2">Transform exam marking with AI assistance</h2>
                        <p className="text-sm opacity-90">Join our platform to streamline grading workflows and gain valuable insights from student assessments</p>
                    </div>
                </div>

                {/* Right side: Form */}
                <div className="flex w-[450px] flex-col justify-center items-center">
                    <Card className="w-full">
                        <CardHeader className="pb-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl">Create an account</CardTitle>
                                <div className="flex items-center space-x-1">
                                    <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                                        <Link href="/" title="Back to Home">
                                            <Home className="h-4 w-4 mr-1" />
                                            <span className="text-xs">Home</span>
                                        </Link>
                                    </Button>
                                    <div className="h-4 w-px bg-border mx-1"></div>
                                    <ThemeToggle />
                                </div>
                            </div>
                            <CardDescription>
                                Enter your information to start using AI-assisted exam marking online
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter your name"
                                        {...register("name")}
                                        disabled={isLoading}
                                    />
                                    {errors.name && (
                                        <div className="text-xs text-red-500 mt-1 mb-1 h-0">{errors.name.message}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        {...register("email")}
                                        disabled={isLoading}
                                    />
                                    {errors.email && (
                                        <div className="text-xs text-red-500 mt-1 mb-1 h-0">{errors.email.message}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Create a password"
                                        {...register("password")}
                                        disabled={isLoading}
                                    />
                                    {errors.password && (
                                        <div className="text-xs text-red-500 mt-1 mb-1 h-0">{errors.password.message}</div>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? "Creating Account..." : "Create Account"}
                                    </Button>
                                </div>

                                <div className="text-center text-sm text-muted-foreground">
                                    By creating an account, you agree to our{" "}
                                    <Link href="#" className="underline underline-offset-4 hover:text-primary">
                                        Terms of Service
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="#" className="underline underline-offset-4 hover:text-primary">
                                        Privacy Policy
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="flex flex-col items-center justify-center space-y-2">
                            <div className="text-center mt-6">
                                <p className="text-sm text-muted-foreground">
                                    Already have an account?{" "}
                                    <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
                                        Login
                                    </Link>
                                </p>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

            </div>
        </div>
    );
} 