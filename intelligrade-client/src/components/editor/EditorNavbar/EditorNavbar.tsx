'use client'

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Check, MoveLeft, Save, FileDown, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditorNavbarProps } from "./interface"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

export function EditorNavbar({ exam, isSaved = true, onSave, onExportPDF }: EditorNavbarProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportedPdfUrl, setExportedPdfUrl] = useState<string | null>(null);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await onSave(exam);
            toast({
                title: "Saved",
                description: "Your changes have been saved.",
                duration: 1000
            });
        } finally {
            setIsSaving(false);
        }
    }

    const handleExportPDF = async () => {
        setIsExporting(true);
        setShowExportDialog(true);
        setExportedPdfUrl(null);

        try {
            await onSave(exam);
            const url = await onExportPDF();
            setExportedPdfUrl(url);
        } catch (error) {
            const message = error instanceof Error ? error.message : "PDF generation failed";
            toast({
                variant: "destructive",
                title: "Export failed",
                description: message,
                duration: 2000
            });
            setShowExportDialog(false);
        } finally {
            setIsExporting(false);
        }
    }

    const handlePreviewPDF = () => {
        if (!exportedPdfUrl) {
            return;
        }

        const anchor = document.createElement("a");
        anchor.href = exportedPdfUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.download = "";

        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    }

    const handleDialogChange = (open: boolean) => {
        setShowExportDialog(open);
        setIsExporting(open);
    }

    return (
        <nav className="flex h-[50px] items-center border-b px-4 justify-between">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                >
                    <a href="/dashboard">
                        <MoveLeft className="h-4 w-4" />
                    </a>
                </Button>
                <h1>{exam.projectName}</h1>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {isSaved ? (
                        <>
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Last saved {format(new Date(exam.updatedAt), "d MMM HH:mm")}</span>
                        </>
                    ) : (
                        <>
                            <X className="h-4 w-4 text-red-500" />
                            <span>Unsaved changes. Last saved {format(new Date(exam.updatedAt), "d MMM HH:mm")}</span>
                        </>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <FileDown className="h-4 w-4" />
                    )}
                    {isExporting ? "Exporting..." : "Export PDF"}
                </Button>
                <ThemeToggle />
            </div>

            <Dialog open={showExportDialog} onOpenChange={handleDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isExporting ? "Exporting PDF" : "Export Complete"}
                        </DialogTitle>
                        <DialogDescription>
                            {isExporting
                                ? "Please wait while we generate your PDF file..."
                                : "Your PDF has been generated successfully!"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center py-4">
                        {isExporting ? (
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <Check className="h-12 w-12 text-green-500" />
                                <Button
                                    onClick={handlePreviewPDF}
                                    className="gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    Preview PDF
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </nav>
    )
} 