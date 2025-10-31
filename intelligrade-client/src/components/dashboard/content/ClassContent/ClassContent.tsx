import { Class, Student } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ClassTable } from "./ClassTable";
import { CommonHeader } from "@/components/dashboard/content/CommonHeader";
import { useAuth } from "@/context/Auth";
import { School } from "lucide-react";
import { MultipleSelector, Option } from "@/components/ui/multiple-selector";
import { getStudentByUserId, createNewClass, getAllClassesByUserId, updateClassStudents, deleteClassById } from "@/lib/api";

const formSchema = z.object({
    name: z.string().min(1, "Class name is required"),
    students: z.array(z.string()).min(1, "At least one student must be selected"),
});

type FormValues = z.infer<typeof formSchema>;

function ClassContent() {
    const [isLoading, setIsLoading] = useState(true);
    const [classes, setClasses] = useState<Class[]>([]);
    const [classToDelete, setClassToDelete] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [forceUpdate, setForceUpdate] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const { documentId: userDocumentId, id: userId } = useAuth();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            students: [],
        },
    });

    // Fetch classes data
    const fetchClasses = async () => {
        if (!userDocumentId) return;
        setIsLoading(true);
        const response = await getAllClassesByUserId(userDocumentId);
        setClasses(response);
        setIsLoading(false);
    };

    // Fetch students data
    const fetchStudents = async () => {
        if (!userDocumentId) return;
        setIsLoadingStudents(true);
        const response = await getStudentByUserId(userId);
        setStudents(response);
        setIsLoadingStudents(false);
    };

    useEffect(() => {
        fetchClasses();
        fetchStudents();
    }, [forceUpdate, userDocumentId]);

    // Handle delete button click
    const handleDelete = async (documentId: string) => {
        setClassToDelete(documentId);
        setIsDeleteDialogOpen(true);
    };

    // Handle confirm delete
    const handleConfirmDelete = async () => {
        if (classToDelete) {
            setIsDeleting(true);
            await deleteClassById(classToDelete);
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setClassToDelete(null);
            setForceUpdate(!forceUpdate);
        }
    };

    // Handle create new class
    const handleCreateNew = () => {
        setIsCreateDialogOpen(true);
    };

    // Convert students to options for MultipleSelector
    const studentOptions: Option[] = students.map((student) => ({
        label: `${student.name} (${student.studentId})`,
        value: student.documentId,
    }));

    // Handle form submission
    const onSubmit = async (data: FormValues) => {
        setIsCreating(true);
        try {
            await createNewClass(data.name, data.students, userDocumentId as string);
            form.reset();
            setForceUpdate(!forceUpdate);
            setIsCreating(false);
            setIsCreateDialogOpen(false);
        } catch (error) {
            console.log("Failed to create class:", error);
        } finally {
            setIsCreating(false);
        }
    };

    // Filter classes based on search query
    const filteredClasses = classes.filter(classItem =>
        classItem.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle update class students
    const handleUpdateClassStudents = async (classId: string, studentIds: string[]) => {
        try {
            await updateClassStudents(classId, studentIds);
            setForceUpdate(!forceUpdate);
            return Promise.resolve();
        } catch (error) {
            console.error("Failed to update class students:", error);
            return Promise.reject(error);
        }
    };

    return (
        <div className="flex flex-col space-y-6 h-[100%]">
            <CommonHeader
                title="Classes"
                description="Manage your classes for AI-assisted grading."
                buttonText="Add New Class"
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
                ) : classes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
                        <div className="bg-muted/40 p-6 rounded-full">
                            <School className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium text-center">No classes yet</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            Add your first class to start managing your teaching for AI-assisted grading.
                        </p>
                        <Button onClick={handleCreateNew} className="mt-2">
                            Add New Class
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-y-auto">
                        <ClassTable
                            classes={filteredClasses}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            handleDelete={handleDelete}
                            allStudents={students}
                            onUpdateClassStudents={handleUpdateClassStudents}
                        />
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to delete this class?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. The class will be permanently deleted from our servers.
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

            {/* Create New Class Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Class</DialogTitle>
                        <DialogDescription>
                            Enter the details to add a new class for AI-assisted grading.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Class Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter class name for AI-assisted grading" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="students"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Students</FormLabel>
                                        <FormControl>
                                            <MultipleSelector
                                                placeholder="Select students for AI-assisted marking"
                                                options={studentOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                disabled={isLoadingStudents}
                                                className="w-full"
                                            />
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
                                        "Add Class"
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

export default ClassContent; 