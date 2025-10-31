import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, FileSpreadsheet, FileCheck, FileCog } from "lucide-react"
import { TemplateSelectionPanelProps } from "./interface";

// 定义模板类型
type TemplateType = {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
}

// 定义模板分类
type TemplateCategory = {
    title: string;
    items: TemplateType[];
}

export function TemplateSelectionPanel({ className, onSelectTemplate, ...props }: TemplateSelectionPanelProps) {
    // 定义模板分类数据
    const templateCategories: TemplateCategory[] = [
        {
            title: "Exam Templates",
            items: [
                {
                    id: "math-exam",
                    icon: FileText,
                    title: "Math Exam",
                    description: "Standard mathematics examination"
                },
                {
                    id: "science-exam",
                    icon: FileSpreadsheet,
                    title: "Science Exam",
                    description: "General science test template"
                },
            ]
        },
        {
            title: "Quiz Templates",
            items: [
                {
                    id: "quiz-basic",
                    icon: FileCheck,
                    title: "Basic Quiz",
                    description: "Simple quiz with various question types"
                },
                {
                    id: "quiz-advanced",
                    icon: FileCog,
                    title: "Advanced Quiz",
                    description: "Comprehensive assessment template"
                }
            ]
        }
    ];

    // 处理模板点击
    const handleTemplateClick = (templateId: string) => {
        onSelectTemplate(templateId);
    };

    return (
        <div className={cn("flex flex-col h-full", className)} {...props}>
            <div className="bg-gradient-to-r from-primary/3 to-primary/5 px-5 py-3 border-b">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-semibold tracking-tight">Templates</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Select a template to start with a pre-designed exam</p>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {templateCategories.map((category) => (
                        <div key={category.title} className="mb-4">
                            <h3 className="text-xs font-medium text-muted-foreground px-2 mb-1">{category.title}</h3>
                            <div className="space-y-1">
                                {category.items.map((item) => (
                                    <button
                                        key={item.id}
                                        className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors text-left"
                                        onClick={() => handleTemplateClick(item.id)}
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