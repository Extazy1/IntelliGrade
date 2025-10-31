import { Student } from "@/types/types";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ArrowUpDown, ChevronDown, ChevronUp, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";

type SortField = "name" | "studentId";
type SortDirection = "asc" | "desc";

interface StudentTableProps {
    students: Student[];
    searchQuery: string;
    onSearchChange: (value: string) => void;
    handleDelete: (documentId: string) => void;
}

export function StudentTable({
    students,
    searchQuery,
    onSearchChange,
    handleDelete,
}: StudentTableProps) {
    // Internal sort state
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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

    // Sort students based on current sort settings
    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => {
            // For each sort field, determine how to compare values
            switch (sortField) {
                case "name":
                    // Compare names alphabetically
                    return sortDirection === "desc"
                        ? b.name.localeCompare(a.name)
                        : a.name.localeCompare(b.name);
                case "studentId":
                    // Compare student IDs
                    return sortDirection === "desc"
                        ? b.studentId.localeCompare(a.studentId)
                        : a.studentId.localeCompare(b.studentId);
                default:
                    return 0;
            }
        });
    }, [students, sortField, sortDirection]);

    return (
        <div className="rounded-sm border bg-background">
            <div className="p-2 sm:p-4 space-y-4">
                <div className="flex justify-start sm:flex-row items-start sm:items-center gap-2">
                    <Input
                        placeholder="Search students by name or ID..."
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
                            <DropdownMenuItem onClick={() => handleSort("studentId")} className="flex items-center justify-between">
                                <span>Student ID</span>
                                {sortField === "studentId" && getSortIcon("studentId")}
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
                                        onClick={() => handleSort("studentId")}
                                        className="flex items-center p-0 h-auto font-medium"
                                    >
                                        Student ID
                                        {getSortIcon("studentId")}
                                    </Button>
                                </TableHead>
                                <TableHead className="w-[120px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedStudents.length > 0 ? (
                                sortedStudents.map((student) => (
                                    <TableRow
                                        key={student.documentId}
                                        className="hover:bg-muted/40 cursor-pointer"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{student.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="whitespace-nowrap bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                                {student.studentId}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                                    title="Delete"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(student.documentId); }}
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
                                        No students found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
} 