import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ArrowUpDown, ChevronDown, ChevronUp, CalendarDays, FileText, School, FolderUp, Play, FileBarChart2, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { ExamSchedule } from "@/types/types";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getClassById } from "@/lib/api";

type SortField = "name" | "examPaper" | "class";
type SortDirection = "asc" | "desc";

interface ExamScheduleTableProps {
    examSchedules: ExamSchedule[];
    searchQuery: string;
    onSearchChange: (value: string) => void;
    handleDelete: (documentId: string) => void;
    handleSubmitPDF?: (documentId: string) => void;
    handleStartPipeline?: (documentId: string) => void;
    handleViewResult?: (documentId: string) => void;
    processingScheduleId?: string | null;
}

export function ExamScheduleTable({
    examSchedules,
    searchQuery,
    onSearchChange,
    handleDelete,
    handleSubmitPDF,
    handleStartPipeline,
    handleViewResult,
    processingScheduleId
}: ExamScheduleTableProps) {
    // Internal sort state
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<ExamSchedule["class"] | null>(null);
    const [isLoadingClassStudents, setIsLoadingClassStudents] = useState(false);
    const router = useRouter();

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            // Toggle direction if clicking the same field
            setSortDirection(sortDirection === "desc" ? "asc" : "desc");
        } else {
            // New field, set to asc by default
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const getSortIcon = (field: SortField) => {
        if (field !== sortField) return <ArrowUpDown className="ml-2 h-4 w-4" />;
        return sortDirection === "desc" ?
            <ChevronDown className="ml-2 h-4 w-4" /> :
            <ChevronUp className="ml-2 h-4 w-4" />;
    };

    // Navigate to exam paper
    const handleExamPaperClick = (examId: string) => {
        router.push(`/editor/${examId}`);
    };

    // Open class dialog
    const handleClassClick = async (classData: ExamSchedule["class"]) => {
        setSelectedClass(classData);
        setIsClassDialogOpen(true);

        try {
            setIsLoadingClassStudents(true);
            const classWithStudents = await getClassById(classData.documentId);
            setSelectedClass(classWithStudents);
        } catch (error) {
            console.error("Failed to fetch class students:", error);
        } finally {
            setIsLoadingClassStudents(false);
        }
    };

    // Handle submit button click based on progress status
    const handleSubmit = (scheduleId: string) => {
        if (handleSubmitPDF) {
            handleSubmitPDF(scheduleId);
        } else {
            // Fallback behavior if handler is not provided
            console.log(`Submit exam schedule: ${scheduleId}`);
        }
    };

    // Handle start pipeline button click
    const handleStart = (scheduleId: string) => {
        if (handleStartPipeline) {
            handleStartPipeline(scheduleId);
        } else {
            // Fallback behavior if handler is not provided
            console.log(`Start pipeline for exam schedule: ${scheduleId}`);
        }
    };

    // Handle view result button click
    const handleResult = (scheduleId: string) => {
        if (handleViewResult) {
            handleViewResult(scheduleId);
        } else {
            // Fallback behavior if handler is not provided
            console.log(`View result for exam schedule: ${scheduleId}`);
        }
    };

    // Get initials from name
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Sort exam schedules based on current sort settings
    const sortedSchedules = useMemo(() => {
        return [...examSchedules].sort((a, b) => {
            // For each sort field, determine how to compare values
            switch (sortField) {
                case "name":
                    // Compare names alphabetically
                    return sortDirection === "desc"
                        ? b.name.localeCompare(a.name)
                        : a.name.localeCompare(b.name);
                case "examPaper":
                    // Compare by exam paper name
                    return sortDirection === "desc"
                        ? b.exam.projectName.localeCompare(a.exam.projectName)
                        : a.exam.projectName.localeCompare(b.exam.projectName);
                case "class":
                    // Compare by class name
                    return sortDirection === "desc"
                        ? b.class.name.localeCompare(a.class.name)
                        : a.class.name.localeCompare(b.class.name);
                default:
                    return 0;
            }
        });
    }, [examSchedules, sortField, sortDirection]);

    // 根据PROGRESS字段渲染不同的按钮
    const renderActionButton = (schedule: ExamSchedule) => {
        const progress = schedule.result?.progress || "CREATED";

        switch (progress) {
            case "CREATED":
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-primary"
                        title="Submit PDF"
                        onClick={() => handleSubmit(schedule.documentId)}
                    >
                        <FolderUp className="h-4 w-4 mr-1.5" />
                        <span>Submit PDF</span>
                    </Button>
                );
            case "UPLOADED":
                const isProcessing = processingScheduleId === schedule.documentId;
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600"
                        title="Start Pipeline"
                        onClick={() => handleStart(schedule.documentId)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-1.5" />
                                <span>Start</span>
                            </>
                        )}
                    </Button>
                );
            case "RESULT_DONE":
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600"
                        title="View Results"
                        onClick={() => handleResult(schedule.documentId)}
                    >
                        <FileBarChart2 className="h-4 w-4 mr-1.5" />
                        <span>Results</span>
                    </Button>
                );
            default:
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-primary"
                    >
                        <a href={`/pipeline/${schedule.documentId}`}>
                            <span>View Process</span>
                        </a>
                    </Button>
                )
        }
    };

    return (
        <div className="rounded-sm border bg-background">
            <div className="p-2 sm:p-4 space-y-4">
                <div className="flex justify-start sm:flex-row items-start sm:items-center gap-2">
                    <Input
                        placeholder="Search exam schedules for AI-assisted marking..."
                        className="w-full sm:max-w-xs"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-1">
                                Sort by
                                {getSortIcon(sortField)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSort("name")} className="flex items-center justify-between">
                                <span>Name</span>
                                {sortField === "name" && getSortIcon("name")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort("examPaper")} className="flex items-center justify-between">
                                <span>Exam Paper</span>
                                {sortField === "examPaper" && getSortIcon("examPaper")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort("class")} className="flex items-center justify-between">
                                <span>Class</span>
                                {sortField === "class" && getSortIcon("class")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[250px]">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("name")}
                                        className="flex items-center p-0 h-auto font-medium"
                                    >
                                        Name
                                        {getSortIcon("name")}
                                    </Button>
                                </TableHead>
                                <TableHead className="w-[250px]">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("examPaper")}
                                        className="flex items-center p-0 h-auto font-medium"
                                    >
                                        Exam Paper
                                        {getSortIcon("examPaper")}
                                    </Button>
                                </TableHead>
                                <TableHead className="w-[200px]">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("class")}
                                        className="flex items-center p-0 h-auto font-medium"
                                    >
                                        Class
                                        {getSortIcon("class")}
                                    </Button>
                                </TableHead>
                                <TableHead className="w-[150px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedSchedules.length > 0 ? (
                                sortedSchedules.map((schedule) => (
                                    <TableRow
                                        key={schedule.documentId}
                                        className="hover:bg-muted/40"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{schedule.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div
                                                className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                                                onClick={() => handleExamPaperClick(schedule.exam.documentId)}
                                            >
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span>{schedule.exam.projectName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div
                                                className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                                                onClick={() => handleClassClick(schedule.class)}
                                            >
                                                <School className="h-4 w-4 text-muted-foreground" />
                                                <span>{schedule.class.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                {renderActionButton(schedule)}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    title="Delete"
                                                    onClick={() => handleDelete(schedule.documentId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No exam schedules found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Class Students Dialog */}
            <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{selectedClass?.name} Students</DialogTitle>
                        <DialogDescription>
                            Students enrolled in this class for AI-assisted marking
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[300px] mt-4">
                        {isLoadingClassStudents ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-md border animate-pulse">
                                        <div className="h-8 w-8 rounded-full bg-muted"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-muted rounded"></div>
                                            <div className="h-3 w-24 bg-muted rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : selectedClass?.students && selectedClass.students.length > 0 ? (
                            <div className="space-y-3">
                                {selectedClass.students.map(student => (
                                    <div key={student.documentId} className="flex items-center gap-3 p-2 rounded-md border">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                {getInitials(student.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{student.name}</p>
                                            <p className="text-xs text-muted-foreground">{student.studentId}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No students in this class
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
} 