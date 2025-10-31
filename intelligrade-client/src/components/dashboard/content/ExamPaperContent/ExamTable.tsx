import { ExamResponse } from "@/types/exam";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Pencil, Trash2, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { format, parse } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";

type SortField = "createdAt" | "updatedAt" | "examDate";
type SortDirection = "asc" | "desc";

interface ExamTableProps {
    exams: ExamResponse[];
    searchQuery: string;
    onSearchChange: (value: string) => void;
    handleEdit: (documentId: string) => void;
    handleDelete: (documentId: string) => void;
}

export function ExamTable({
    exams,
    searchQuery,
    onSearchChange,
    handleEdit,
    handleDelete,
}: ExamTableProps) {
    // Internal sort state
    const [sortField, setSortField] = useState<SortField>("updatedAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            // Toggle direction if clicking the same field
            setSortDirection(sortDirection === "desc" ? "asc" : "desc");
        } else {
            // New field, set to desc by default (newest first)
            setSortField(field);
            setSortDirection("desc");
        }
    };

    const getSortIcon = (field: SortField) => {
        if (field !== sortField) return <ArrowUpDown className="ml-2 h-4 w-4" />;
        return sortDirection === "desc" ?
            <ChevronDown className="ml-2 h-4 w-4" /> :
            <ChevronUp className="ml-2 h-4 w-4" />;
    };

    // Sort exams based on current sort settings
    const sortedExams = useMemo(() => {
        return [...exams].sort((a, b) => {
            // For each sort field, determine how to compare values
            switch (sortField) {
                case "updatedAt":
                    // Compare update timestamps
                    const updateDateA = new Date(a.updatedAt).getTime();
                    const updateDateB = new Date(b.updatedAt).getTime();
                    return sortDirection === "desc" ? updateDateB - updateDateA : updateDateA - updateDateB;
                case "createdAt":
                    // Compare creation timestamps
                    const dateA = new Date(a.createdAt).getTime();
                    const dateB = new Date(b.createdAt).getTime();
                    return sortDirection === "desc" ? dateB - dateA : dateA - dateB;
                case "examDate":
                    // Compare exam dates - need to parse from string format
                    let examDateA: Date | null = null;
                    let examDateB: Date | null = null;

                    // First try to parse as date string
                    examDateA = parse(a.examData.examDate, "MMM d, yyyy", new Date());
                    examDateB = parse(b.examData.examDate, "MMM d, yyyy", new Date());

                    // Compare parsed dates
                    return sortDirection === "desc"
                        ? examDateB.getTime() - examDateA.getTime()
                        : examDateA.getTime() - examDateB.getTime();
                default:
                    return 0;
            }
        });
    }, [exams, sortField, sortDirection]);

    return (
        <div className="rounded-sm border bg-background">
            <div className="p-2 sm:p-4 space-y-4">
                <div className="flex justify-start sm:flex-row items-start sm:items-center gap-2">
                    <Input
                        placeholder="Filter exams..."
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
                            <DropdownMenuItem onClick={() => handleSort("createdAt")} className="flex items-center justify-between">
                                <span>Creation Time</span>
                                {sortField === "createdAt" && getSortIcon("createdAt")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort("updatedAt")} className="flex items-center justify-between">
                                <span>Last Updated</span>
                                {sortField === "updatedAt" && getSortIcon("updatedAt")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort("examDate")} className="flex items-center justify-between">
                                <span>Exam Date</span>
                                {sortField === "examDate" && getSortIcon("examDate")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[250px]">Title</TableHead>
                                <TableHead className="w-[120px] hidden sm:table-cell">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("examDate")}
                                        className="flex items-center p-0 h-auto font-medium"
                                    >
                                        Exam Date
                                        {getSortIcon("examDate")}
                                    </Button>
                                </TableHead>
                                <TableHead className="w-[120px] hidden md:table-cell">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("updatedAt")}
                                        className="flex items-center p-0 h-auto font-medium"
                                    >
                                        Last Updated
                                        {getSortIcon("updatedAt")}
                                    </Button>
                                </TableHead>
                                <TableHead className="w-[140px] hidden sm:table-cell">Duration</TableHead>
                                <TableHead className="w-[120px] hidden lg:table-cell">Academic Year</TableHead>
                                <TableHead className="w-[120px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedExams.length > 0 ? (
                                sortedExams.map((exam) => {
                                    const formattedExamDate = format(new Date(exam.createdAt), "MMM d, yyyy");

                                    return (
                                        <TableRow
                                            key={exam.documentId}
                                            className="hover:bg-muted/40 cursor-pointer"
                                            onClick={() => handleEdit(exam.documentId)}
                                        >
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium line-clamp-2">{exam.projectName}</span>
                                                    <span className="text-sm text-muted-foreground line-clamp-2">{exam.examData.course}</span>
                                                    <div className="flex flex-wrap gap-2 mt-1 sm:hidden">
                                                        <Badge variant="outline" className="whitespace-nowrap bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                                                            {exam.examData.examDate}
                                                        </Badge>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-sm">{exam.examData.duration}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge variant="outline" className="whitespace-nowrap bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                                                    {exam.examData.examDate}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <Badge variant="outline" className="whitespace-nowrap bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                                    {format(new Date(exam.updatedAt), "MMM d, yyyy")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span>{exam.examData.duration}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <Badge variant="outline" className="whitespace-nowrap bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                                                    {exam.examData.year}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" title="Edit" onClick={(e) => { e.stopPropagation(); handleEdit(exam.documentId); }}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                                        title="Delete"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(exam.documentId); }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No exams found
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