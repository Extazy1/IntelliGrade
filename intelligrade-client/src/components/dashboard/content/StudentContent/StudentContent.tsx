import { Student } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { StudentTable } from "./StudentTable";
import { CommonHeader } from "@/components/dashboard/content/CommonHeader";
import { deleteStudentById, getStudentByUserId, createStudent } from "@/lib/api";
import { useAuth } from "@/context/Auth";
import { UserPlus } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(1, "Student name is required"),
    studentId: z.string().min(1, "Student ID is required"),
});

type FormValues = z.infer<typeof formSchema>;

function StudentContent() {
    const [isLoading, setIsLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [forceUpdate, setForceUpdate] = useState(false);
    const { id: userId } = useAuth();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            studentId: "",
        },
    });

    // Fetch students data
    const fetchStudents = async () => {
        if (!userId) return;
        setIsLoading(true);
        const response = await getStudentByUserId(userId);
        setStudents(response);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchStudents();
    }, [forceUpdate]);

    // Handle delete button click
    const handleDelete = async (documentId: string) => {
        setStudentToDelete(documentId);
        setIsDeleteDialogOpen(true);
    };

    // Handle confirm delete
    const handleConfirmDelete = async () => {
        if (studentToDelete) {
            setIsDeleting(true);
            await deleteStudentById(userId, studentToDelete);
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setStudentToDelete(null);
            setForceUpdate(!forceUpdate);
        }
    };

    // Handle create new student
    const handleCreateNew = () => {
        setIsCreateDialogOpen(true);
    };

    // Handle form submission
    const onSubmit = async (data: FormValues) => {
        setIsCreating(true);
        try {
            await createStudent(userId, { name: data.name, studentId: data.studentId });
            form.reset();
            setForceUpdate(!forceUpdate);
            setIsCreating(false);
            setIsCreateDialogOpen(false);
        } catch (error) {
            console.log("Failed to create student:", error);
        } finally {
            setIsCreating(false);
        }
    };

    // Filter students based on search query
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col space-y-6 h-[100%]">
            <CommonHeader
                title="Students"
                description="Manage your students for AI-assisted grading."
                buttonText="Add New Student"
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
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
                        <div className="bg-muted/40 p-6 rounded-full">
                            <UserPlus className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium text-center">No students yet</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            Add your first student to start managing your class for AI-assisted grading.
                        </p>
                        <Button onClick={handleCreateNew} className="mt-2">
                            Add New Student
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-y-auto">
                        <StudentTable
                            students={filteredStudents}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            handleDelete={handleDelete}
                        />
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to delete this student?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. The student will be permanently deleted from our servers.
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

            {/* Create New Student Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>
                            Enter the details to add a new student for AI-assisted grading.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Student Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter student name for AI-assisted grading" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="studentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Student ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter student ID for AI-assisted marking" {...field} />
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
                                        "Add Student"
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

export default StudentContent; 