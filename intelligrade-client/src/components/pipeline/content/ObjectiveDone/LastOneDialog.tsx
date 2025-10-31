import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface LastOneDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onNextStep: () => void;
}

export default function LastOneDialog({ open, onOpenChange, onNextStep }: LastOneDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>All Questions Completed</DialogTitle>
                    <DialogDescription className="mt-2">
                        You have successfully processed all objective questions.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                </div>
                <DialogFooter>
                    <Button onClick={() => {
                        onOpenChange(false);
                        onNextStep();
                    }}>
                        Continue to Preview
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 