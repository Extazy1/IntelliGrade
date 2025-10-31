import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ExamConfigFormProps } from "./interface"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ExamResponse } from "@/types/exam"

const formSchema = z.object({
    projectName: z.string().min(2, {
        message: "Project name must be at least 2 characters."
    }),
    title: z.string().min(2, {
        message: "Title must be at least 2 characters."
    }),
    description: z.string(),
    duration: z.string().min(1, {
        message: "Duration is required."
    }),
    university: z.string().min(1, {
        message: "University name is required."
    }),
    course: z.string().min(1, {
        message: "Course name is required."
    }),
    year: z.string().min(1, {
        message: "Academic year is required."
    }),
    semester: z.string().min(1, {
        message: "Semester is required."
    }),
    examDate: z.string().min(1, {
        message: "Exam date is required."
    }),
})

export default function ExamConfigForm({ exam, onExamConfigChange }: ExamConfigFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            projectName: exam.projectName,
            title: exam.examData.title,
            description: exam.examData.description,
            duration: exam.examData.duration,
            university: exam.examData.university,
            course: exam.examData.course,
            year: exam.examData.year,
            semester: exam.examData.semester,
            examDate: exam.examData.examDate,
        },
    })

    async function onSubmit(values: Partial<ExamResponse>) {
        // 构造一个完整的 ExamResponse 对象
        const updatedExam: ExamResponse = {
            ...exam,
            projectName: values.projectName || exam.projectName,
            examData: {
                ...exam.examData,
                ...values
            }
        }
        setIsLoading(true)
        try {
            await onExamConfigChange(updatedExam)
            toast({
                title: "Exam configuration saved",
                description: "The exam configuration has been saved successfully",
                duration: 1500,
            })
        } finally {
            setIsLoading(false)
        }
    }

    const semesters = ["Spring", "Summer", "Fall", "Winter"]

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-1">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="projectName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter project name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Exam Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter exam title" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="course"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Course</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter course name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />


                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter exam description"
                                        className="min-h-[80px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duration</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter exam duration" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="examDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Exam Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="university"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>University</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter university name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="year"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Academic Year</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter academic year" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="semester"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Semester</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select semester" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {semesters.map((semester) => (
                                                <SelectItem key={semester} value={semester}>
                                                    {semester}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

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
    )
} 