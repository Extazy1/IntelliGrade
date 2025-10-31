import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { MCQConfigFormProps } from "./interface"
import { MultipleSelector } from "@/components/ui/multiple-selector"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import cloneDeep from 'lodash/cloneDeep'
import { MultipleChoiceQuestionData } from "@/types/exam"

const formSchema = z.object({
    score: z.coerce.number().min(1, {
        message: "Score must be a positive number."
    }),
    answer: z.array(z.string()).min(1, {
        message: "At least one answer must be selected."
    })
})

export default function MCQConfigForm({ mcq, exam, selectedComponentId, onExamConfigChange }: MCQConfigFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            score: mcq.score,
            answer: mcq.answer,
        },
    })

    // 将mcq选项转换为MultipleSelector需要的格式
    const mcqOptions = mcq.options.map(option => ({
        label: option.label,
        value: option.label, // 使用label作为value
    }));

    // 当选择变化时通知父组件
    const handleAnswerChange = (selectedAnswers: string[]) => {
        form.setValue('answer', selectedAnswers);
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            // 创建更新后的完整 ExamResponse
            const updatedExam = cloneDeep(exam);
            const componentIndex = updatedExam.examData.components.findIndex(component => component.id === selectedComponentId);

            if (componentIndex !== -1) {
                // 确保保持原始类型
                const originalComponent = updatedExam.examData.components[componentIndex] as MultipleChoiceQuestionData;
                updatedExam.examData.components[componentIndex] = {
                    ...originalComponent,
                    score: values.score,
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
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-1">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="score"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Question Mark</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Enter point value for this question"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="answer"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Correct Answer(s)</FormLabel>
                                <FormControl>
                                    <MultipleSelector
                                        value={field.value}
                                        onChange={handleAnswerChange}
                                        options={mcqOptions}
                                        placeholder="Select correct answers"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button disabled={isLoading} type="submit" className="w-full mt-6">
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
    )
} 