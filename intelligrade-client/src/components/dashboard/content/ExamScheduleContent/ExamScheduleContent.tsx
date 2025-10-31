"use client";

import { ExamResponse } from "@/types/exam";
import { Class, ExamSchedule } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ExamScheduleTable } from "./ExamScheduleTable";
import { CommonHeader } from "@/components/dashboard/content/CommonHeader";
import { useAuth } from "@/context/Auth";
import { CalendarDays, Upload, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getExamByUserId, getAllClassesByUserId, createExamSchedule, getExamSchedulesByUserId, deleteExamScheduleById, uploadPDF, startMatching } from "@/lib/api";
import { useRouter } from "next/navigation";

// Define the form schema for creating a new exam schedule
const formSchema = z.object({
    name: z.string().min(1, "Exam name is required"),
    examPaperId: z.string().min(1, "Exam paper is required"),
    classId: z.string().min(1, "Class is required"),
});

// Define the PDF upload form schema
const createPdfUploadSchema = () =>
    z.object({
        pdfFile: z
            .custom<File>(
                (value): value is File =>
                    typeof File !== "undefined" && value instanceof File,
                {
                    message: "Please select a PDF file",
                }
            )
            .refine(
                file => file.type === "application/pdf",
                {
                    message: "File must be a PDF",
                }
            ),
    });

type FormValues = z.infer<typeof formSchema>;
type PDFUploadSchema = ReturnType<typeof createPdfUploadSchema>;
type PDFUploadValues = z.infer<PDFUploadSchema>;

function ExamScheduleContent() {
    const [isLoading, setIsLoading] = useState(true);
    const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
    const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isPdfUploadDialogOpen, setIsPdfUploadDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [forceUpdate, setForceUpdate] = useState(false);
    const [examPapers, setExamPapers] = useState<ExamResponse[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [isLoadingExamPapers, setIsLoadingExamPapers] = useState(false);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);
    const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);
    const { documentId: userDocumentId } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            examPaperId: "",
            classId: "",
        },
    });

    const pdfUploadSchema = useMemo(createPdfUploadSchema, []);

    const pdfUploadForm = useForm<PDFUploadValues>({
        resolver: zodResolver(pdfUploadSchema),
    });

    // 监听PDF文件选择状态
    const pdfFile = pdfUploadForm.watch('pdfFile');

    // Fetch exam schedules data
    const fetchExamSchedules = async () => {
        if (!userDocumentId) return;
        setIsLoading(true);
        const response = await getExamSchedulesByUserId(userDocumentId);
        setExamSchedules(response);
        setIsLoading(false);
    };

    // Fetch exam papers data
    const fetchExamPapers = async () => {
        if (!userDocumentId) return;
        setIsLoadingExamPapers(true);
        const response = await getExamByUserId(userDocumentId);
        setExamPapers(response.data);
        setIsLoadingExamPapers(false);
    };

    // Fetch classes data
    const fetchClasses = async () => {
        if (!userDocumentId) return;
        setIsLoadingClasses(true);
        const response = await getAllClassesByUserId(userDocumentId);
        setClasses(response);
        setIsLoadingClasses(false);
    };

    useEffect(() => {
        fetchExamSchedules();
        fetchExamPapers();
        fetchClasses();
    }, [forceUpdate, userDocumentId]);

    // Handle delete button click
    const handleDelete = async (documentId: string) => {
        setScheduleToDelete(documentId);
        await deleteExamScheduleById(documentId);
        setIsDeleteDialogOpen(true);
    };

    // Handle confirm delete
    const handleConfirmDelete = async () => {
        if (scheduleToDelete) {
            setIsDeleting(true);
            // This is a placeholder - you'll need to implement the actual API call
            // await deleteExamScheduleById(scheduleToDelete);
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setScheduleToDelete(null);
            setForceUpdate(!forceUpdate);
        }
    };

    // Handle create new exam schedule
    const handleCreateNew = () => {
        setIsCreateDialogOpen(true);
    };

    // Handle PDF upload button click
    const handleSubmitPDF = (scheduleId: string) => {
        setCurrentScheduleId(scheduleId);
        setIsPdfUploadDialogOpen(true);
    };

    // Handle PDF upload form submission
    const onPdfUploadSubmit = async (data: PDFUploadValues) => {
        if (!currentScheduleId) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('files', data.pdfFile);
            await uploadPDF(formData, currentScheduleId);
            setIsPdfUploadDialogOpen(false);
            setCurrentScheduleId(null);
            pdfUploadForm.reset();
            // 强制更新表格数据
            setIsUploading(false);
            setForceUpdate(!forceUpdate);
        } catch (error) {
            console.log("Failed to upload PDF:", error);
        } finally {
            setIsUploading(false);
        }
    };

    // Handle form submission
    const onSubmit = async (data: FormValues) => {
        setIsCreating(true);
        try {
            const examSchedule = {
                name: data.name,
                exam: data.examPaperId,
                class: data.classId,
                teacher: userDocumentId
            }
            await createExamSchedule(examSchedule);
            form.reset();
            setForceUpdate(!forceUpdate);
            setIsCreating(false);
            setIsCreateDialogOpen(false);
        } catch (error) {
            console.log("Failed to create exam schedule:", error);
        } finally {
            setIsCreating(false);
        }
    };

    // 验证上传的文件是否是一个PDF
    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                pdfUploadForm.setValue('pdfFile', file);
                // 触发表单验证状态更新
                pdfUploadForm.trigger('pdfFile');
            } else {
                pdfUploadForm.setError('pdfFile', {
                    type: 'validate',
                    message: 'File must be a PDF'
                });
            }
        }
    };

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    // Filter exam schedules based on search query
    const filteredSchedules = examSchedules.filter(schedule =>
        schedule.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle start pipeline button click
    const handleStartPipeline = async (scheduleId: string) => {
        setLoading(true);
        // 设置当前处理的scheduleId
        setCurrentScheduleId(scheduleId);
        await startMatching(scheduleId);
        setLoading(false);
        // 清除当前处理的scheduleId
        setCurrentScheduleId(null);
        router.push(`/pipeline/${scheduleId}`);
    };

    // Handle view result button click
    const handleViewResult = (scheduleId: string) => {
        router.push(`/pipeline/${scheduleId}`);
    };

    return (
        <div className="flex flex-col space-y-6 h-[100%]">
            {/* Loading Dialog */}
            <Dialog open={loading} onOpenChange={(open) => !open && setLoading(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Initializing...</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-center text-sm">Processing your exam papers...</p>
                    </div>
                </DialogContent>
            </Dialog>
            <CommonHeader
                title="Exam Schedules"
                description="Manage your exam schedules for AI-assisted grading."
                buttonText="Add New Schedule"
                onButtonClick={handleCreateNew}
            />

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="w-full space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                    </div>
                ) : examSchedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
                        <div className="bg-muted/40 p-6 rounded-full">
                            <CalendarDays className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium text-center">No exam schedules yet</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            Add your first exam schedule to start managing your exams for AI-assisted grading.
                        </p>
                        <Button onClick={handleCreateNew} className="mt-2">
                            Add New Schedule
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-y-auto">
                        <ExamScheduleTable
                            examSchedules={filteredSchedules}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            handleDelete={handleDelete}
                            handleSubmitPDF={handleSubmitPDF}
                            handleStartPipeline={handleStartPipeline}
                            handleViewResult={handleViewResult}
                            processingScheduleId={currentScheduleId}
                        />
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to delete this exam schedule?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. The exam schedule will be permanently deleted from our servers.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <span className="mr-2 h-4 w-4 animate-spin">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                    </span>
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create New Exam Schedule Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Exam Schedule</DialogTitle>
                        <DialogDescription>
                            Enter the details to add a new exam schedule for AI-assisted grading.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Exam Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter exam name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="examPaperId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Exam Paper</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={isLoadingExamPapers}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an exam paper" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {examPapers.map((exam) => (
                                                        <SelectItem key={exam.documentId} value={exam.documentId}>
                                                            {exam.projectName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="classId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Class</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={isLoadingClasses}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a class" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {classes.map((classItem) => (
                                                        <SelectItem key={classItem.documentId} value={classItem.documentId}>
                                                            {classItem.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? (
                                        <>
                                            <span className="mr-2 h-4 w-4 animate-spin">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                            </span>
                                            Creating...
                                        </>
                                    ) : (
                                        "Create"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* PDF Upload Dialog */}
            <Dialog open={isPdfUploadDialogOpen} onOpenChange={setIsPdfUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Student Answer Sheets</DialogTitle>
                        <DialogDescription>
                            Upload a PDF file containing student answer sheets.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...pdfUploadForm}>
                        <form onSubmit={pdfUploadForm.handleSubmit(onPdfUploadSubmit)} className="space-y-4">
                            <FormField
                                control={pdfUploadForm.control}
                                name="pdfFile"
                                render={({ field: { value, onChange, ...field } }) => (
                                    <FormItem>
                                        <FormControl>
                                            {isUploading ? (
                                                <div className="flex flex-col items-center justify-center p-10">
                                                    <div className="h-16 w-16 animate-spin mb-4">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                                    </div>
                                                    <p className="text-sm font-medium text-center mb-2">Uploading your PDF...</p>
                                                    <p className="text-xs text-muted-foreground text-center">
                                                        This may take a moment depending on file size
                                                    </p>
                                                </div>
                                            ) : (
                                                <div
                                                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                                    onDragOver={onDragOver}
                                                    onDrop={onDrop}
                                                >
                                                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                                    <p className="text-sm text-muted-foreground text-center mb-2">
                                                        Drag and drop a PDF file here, or click to select
                                                    </p>
                                                    <p className="text-xs text-muted-foreground text-center mb-4">
                                                        The PDF should contain student answers for AI-assisted marking
                                                    </p>
                                                    <Input
                                                        type="file"
                                                        accept="application/pdf"
                                                        id="pdfFile"
                                                        {...field}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                onChange(file);
                                                                // 触发表单验证状态更新
                                                                pdfUploadForm.trigger('pdfFile');
                                                            }
                                                        }}
                                                        className="hidden"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => document.getElementById('pdfFile')?.click()}
                                                    >
                                                        Select PDF
                                                    </Button>
                                                    {value && (
                                                        <div className="mt-4 text-sm text-primary">
                                                            Selected: {(value as File).name}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setIsPdfUploadDialogOpen(false)}
                                    disabled={isUploading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isUploading || !pdfFile}
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="mr-2 h-4 w-4 animate-spin">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                            </span>
                                            Uploading...
                                        </>
                                    ) : (
                                        "Upload PDF"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export { ExamScheduleContent }; 