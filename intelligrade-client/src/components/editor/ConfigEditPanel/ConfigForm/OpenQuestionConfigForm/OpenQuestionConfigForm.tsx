import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OpenQuestionConfigFormProps } from "./interface";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import cloneDeep from 'lodash/cloneDeep';
import { OpenQuestionData } from "@/types/exam";

const formSchema = z.object({
    score: z.coerce.number().min(1, {
        message: "Score must be a positive number."
    }),
    lines: z.coerce.number().min(1, {
        message: "Number of lines must be at least 1."
    }),
    answer: z.string().min(1, {
        message: "Answer is required."
    })
});

export default function OpenQuestionConfigForm({ openQuestion, exam, selectedComponentId, onExamConfigChange }: OpenQuestionConfigFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            score: openQuestion.score,
            lines: openQuestion.lines,
            answer: openQuestion.answer,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            // 创建更新后的完整 ExamResponse
            const updatedExam = cloneDeep(exam);
            const componentIndex = updatedExam.examData.components.findIndex(component => component.id === selectedComponentId);

            if (componentIndex !== -1) {
                // 确保保持原始类型
                const originalComponent = updatedExam.examData.components[componentIndex] as OpenQuestionData;
                updatedExam.examData.components[componentIndex] = {
                    ...originalComponent,
                    score: values.score,
                    lines: values.lines,
                    answer: values.answer
                };
                await onExamConfigChange(updatedExam);
            }

            toast({
                title: "Exam configuration saved",
                description: "The exam configuration has been saved successfully",
                duration: 1500,
            })
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
                <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Question Mark</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Enter score for this question"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="lines"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Answer Space Lines</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Enter number of lines for answer space"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                How many lines to reserve for student answers
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="answer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Answer</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter the correct answer"
                                    className="min-h-[120px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Reference answer that will be used for AI-assisted marking
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button disabled={isLoading} type="submit" className="w-full">
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </Button>
            </form>
        </Form>
    );
} 