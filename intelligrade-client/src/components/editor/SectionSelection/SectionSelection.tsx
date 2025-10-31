import { cn } from "@/lib/utils"
import { type SectionSelectionProps } from "./interface"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Grid2X2, FileText, Library } from "lucide-react"

export function SectionSelection({ className, onTabChange, activeTab, ...props }: SectionSelectionProps) {
    return (
        <div className={cn("w-full", className)} {...props}>
            <Tabs value={activeTab} onValueChange={onTabChange} orientation="vertical" className="w-full">
                <TabsList className="flex flex-col px-2 h-auto w-full space-y-2 bg-transparent">
                    <TabsTrigger
                        value="components"
                        className="w-full flex items-center gap-3 justify-start px-3 py-2 data-[state=active]:bg-accent"
                    >
                        <Grid2X2 className="w-5 h-5" />
                        <span>Components</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="templates"
                        className="w-full flex items-center gap-3 justify-start px-3 py-2 data-[state=active]:bg-accent"
                    >
                        <FileText className="w-5 h-5" />
                        <span>Template</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="bank"
                        className="w-full flex items-center gap-3 justify-start px-3 py-2 data-[state=active]:bg-accent"
                    >
                        <Library className="w-5 h-5" />
                        <span>Bank</span>
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    )
} 