import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CommonHeaderProps } from "./interface";

export function CommonHeader({
    title,
    description,
    buttonText,
    onButtonClick,
}: CommonHeaderProps) {
    return (
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                <p className="text-muted-foreground mt-1">{description}</p>
            </div>
            <Button onClick={onButtonClick} className="rounded-md shadow-sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                {buttonText}
            </Button>
        </div>
    );
}

export default CommonHeader; 