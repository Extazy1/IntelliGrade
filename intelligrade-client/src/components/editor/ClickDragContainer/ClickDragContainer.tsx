'use client';

import { ClickDragContainerProps } from './interface';
import { useState } from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ClickDragContainer({
    children,
    onClick,
    componentId,
    onDelete,
    onMoveUp,
    onMoveDown,
}: ClickDragContainerProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleClick = () => {
        onClick(componentId);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = () => {
        onDelete(componentId);
        setShowDeleteDialog(false);
    };

    const handleMoveUp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onMoveUp) {
            onMoveUp(componentId);
        }
    };

    const handleMoveDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onMoveDown) {
            onMoveDown(componentId);
        }
    };

    return (
        <div
            className={
                'cursor-pointer relative group transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-900'
            }
            onClick={handleClick}
            data-component-id={componentId}
        >
            <div className="absolute opacity-0 group-hover:opacity-100 right-2 top-2 z-10 transition-all duration-200 transform scale-95 group-hover:scale-100 flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900 hover:text-primary transition-colors"
                    onClick={handleMoveUp}
                    title="Move Up"
                >
                    <ChevronUp className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900 hover:text-primary transition-colors"
                    onClick={handleMoveDown}
                    title="Move Down"
                >
                    <ChevronDown className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md hover:bg-red-200 dark:hover:bg-red-900 hover:text-primary transition-colors"
                    onClick={handleDeleteClick}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            {children}

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to delete this item?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 