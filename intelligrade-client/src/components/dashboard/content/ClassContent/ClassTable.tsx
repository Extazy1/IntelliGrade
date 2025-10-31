import { Class, Student } from "@/types/types";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ArrowUpDown, ChevronDown, ChevronUp, School, Users, UserPlus, X } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MultipleSelector, Option } from "@/components/ui/multiple-selector";

type SortField = "name" | "students";
type SortDirection = "asc" | "desc";

interface ClassTableProps {
    classes: Class[];
    searchQuery: string;
    onSearchChange: (value: string) => void;
    handleDelete: (documentId: string) => void;
    allStudents: Student[];
    onUpdateClassStudents?: (classId: string, studentIds: string[]) => Promise<void>;
}

export function ClassTable({
    classes,
    searchQuery,
    onSearchChange,
    handleDelete,
    allStudents,
    onUpdateClassStudents
}: ClassTableProps) {
    // Internal sort state
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isUpdatingStudents, setIsUpdatingStudents] = useState(false);

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

    // Sort classes based on current sort settings
    const sortedClasses = useMemo(() => {
        return [...classes].sort((a, b) => {
            // For each sort field, determine how to compare values
            switch (sortField) {
                case "name":
                    // Compare names alphabetically
                    return sortDirection === "desc"
                        ? b.name.localeCompare(a.name)
                        : a.name.localeCompare(b.name);
                case "students":
                    // Compare by number of students
                    return sortDirection === "desc"
                        ? b.students.length - a.students.length
                        : a.students.length - b.students.length;
                default:
                    return 0;
            }
        });
    }, [classes, sortField, sortDirection]);

    // Get initials from name
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Handle opening manage students dialog
    const handleManageStudents = (classItem: Class) => {
        setSelectedClass(classItem);
        setSelectedStudents(classItem.students.map(student => student.documentId));
        setIsManageStudentsOpen(true);
    };

    // Handle saving student changes
    const handleSaveStudents = async () => {
        if (!selectedClass || !onUpdateClassStudents) return;

        setIsUpdatingStudents(true);
        try {
            await onUpdateClassStudents(selectedClass.documentId, selectedStudents);
            setIsManageStudentsOpen(false);
        } catch (error) {
            console.error("Failed to update students:", error);
        } finally {
            setIsUpdatingStudents(false);
        }
    };

    // Convert all students to options for MultipleSelector
    const studentOptions: Option[] = allStudents.map((student) => ({
        label: `${student.name} (${student.studentId})`,
        value: student.documentId,
    }));

    return (
        <div className="rounded-sm border bg-background">
            <div className="p-2 sm:p-4 space-y-4">
                <div className="flex justify-start sm:flex-row items-start sm:items-center gap-2">
                    <Input
                        placeholder="Search classes for AI-assisted marking..."
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
                            <DropdownMenuItem onClick={() => handleSort("students")} className="flex items-center justify-between">
                                <span>Students</span>
                                {sortField === "students" && getSortIcon("students")}
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
                                <TableHead className="w-[200px]">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("students")}
                                        className="flex items-center p-0 h-auto font-medium"
                                    >
                                        Students
                                        {getSortIcon("students")}
                                    </Button>
                                </TableHead>
                                <TableHead className="w-[180px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedClasses.length > 0 ? (
                                sortedClasses.map((classItem) => (
                                    <TableRow
                                        key={classItem.documentId}
                                        className="hover:bg-muted/40 cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); handleManageStudents(classItem); }}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <School className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{classItem.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="whitespace-nowrap bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                                {classItem.students.length} {classItem.students.length === 1 ? 'student' : 'students'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={(e) => { e.stopPropagation(); handleManageStudents(classItem); }}
                                                >
                                                    <Users className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                                    title="Delete"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(classItem.documentId); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        No classes found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Manage Students Dialog */}
            <Dialog open={isManageStudentsOpen} onOpenChange={setIsManageStudentsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Manage Students</DialogTitle>
                        <DialogDescription>
                            Add or remove students from {selectedClass?.name} for AI-assisted grading.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Students</label>
                            <MultipleSelector
                                placeholder="Select students for AI-assisted marking"
                                options={studentOptions}
                                value={selectedStudents}
                                onChange={setSelectedStudents}
                                className="w-full"
                            />
                        </div>

                        {selectedStudents.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Selected Students</label>
                                <ScrollArea className="h-[200px] rounded-md border p-2">
                                    <div className="space-y-2">
                                        {selectedStudents.map(studentId => {
                                            const student = allStudents.find(s => s.documentId === studentId);
                                            if (!student) return null;

                                            return (
                                                <div key={student.documentId} className="flex items-center justify-between rounded-md border p-2">
                                                    <div className="flex items-center gap-2">
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
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                        onClick={() => setSelectedStudents(selectedStudents.filter(id => id !== student.documentId))}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setIsManageStudentsOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveStudents} disabled={isUpdatingStudents}>
                            {isUpdatingStudents ? (
                                <>
                                    <span className="mr-2 h-4 w-4 animate-spin">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                    </span>
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 