import { cn } from "@/lib/utils"
import { type QuestionSelectionPanelProps } from "./interface"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SplitSquareVertical, Type, ListChecks, SquareDashed, Text, Layers } from "lucide-react"

// 定义组件类型
type ComponentType = {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
}

// 定义组件分类
type ComponentCategory = {
    title: string;
    items: ComponentType[];
}

export function QuestionSelectionPanel({ className, onAddComponent, ...props }: QuestionSelectionPanelProps) {
    // 定义组件分类数据
    const componentCategories: ComponentCategory[] = [
        {
            title: "Question Types",
            items: [
                {
                    id: "multiple-choice-question",
                    icon: ListChecks,
                    title: "Multiple Choice",
                    description: "Question with selectable options"
                },
                {
                    id: "fill-in-blank-question",
                    icon: Type,
                    title: "Fill in Blank",
                    description: "Text with blank spaces to complete"
                },
                {
                    id: "open-question",
                    icon: Text,
                    title: "Open Question",
                    description: "Free-form response area"
                }
            ]
        },
        {
            title: "Layout Components",
            items: [
                {
                    id: "blank",
                    icon: SquareDashed,
                    title: "Blank Space",
                    description: "Empty space for separation"
                },
                {
                    id: "divider",
                    icon: SplitSquareVertical,
                    title: "Divider",
                    description: "Horizontal separator line"
                }
            ]
        }
    ];

    // 处理组件点击
    const handleComponentClick = (componentId: string) => {
        onAddComponent(componentId);
    };

    return (
        <div className={cn("flex flex-col h-full", className)} {...props}>
            <div className="bg-gradient-to-r from-primary/3 to-primary/5 px-5 py-3 border-b">
                <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-semibold tracking-tight">Components</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Click on a component to add it to your exam paper</p>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {componentCategories.map((category) => (
                        <div key={category.title} className="mb-4">
                            <h3 className="text-xs font-medium text-muted-foreground px-2 mb-1">{category.title}</h3>
                            <div className="space-y-1">
                                {category.items.map((item) => (
                                    <button
                                        key={item.id}
                                        className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors text-left"
                                        onClick={() => handleComponentClick(item.id)}
                                    >
                                        <div className="bg-primary/10 p-1.5 rounded-md flex-shrink-0">
                                            <item.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium">{item.title}</div>
                                            <div className="text-xs text-muted-foreground">{item.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
} 