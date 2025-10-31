import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Sigma } from "lucide-react";
import { ExamSchedule } from "@/types/types";

interface ResultDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    allQuestionNum: number;
    successQuestionNum: number;
    failedQuestionNum: number;
}

export default function ResultDialog({ open, onOpenChange, allQuestionNum, successQuestionNum, failedQuestionNum }: ResultDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Objective Questions Recognition Results</DialogTitle>
                    <DialogDescription className="mt-2">
                        Failed questions need to be manually graded on this page.
                    </DialogDescription>
                </DialogHeader>
                <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                        <Sigma className="h-5 w-5 text-primary text-blue-500" />
                        <span>Total questions: {allQuestionNum}</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Successfully recognized: {successQuestionNum}</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        <span>Failed to recognize: {failedQuestionNum}</span>
                    </li>
                </ul>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Continue</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
