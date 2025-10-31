import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Library, BookOpen, GraduationCap, Calculator, Beaker } from "lucide-react"
import { BankSelectionPanelProps } from "./interface";

// 定义题库类型
type BankItem = {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    questionCount: number;
}

// 定义题库分类
type BankCategory = {
    title: string;
    items: BankItem[];
}

export function BankSelectionPanel({ className, onSelectBank, ...props }: BankSelectionPanelProps) {
    // 定义题库分类数据
    const bankCategories: BankCategory[] = [
        {
            title: "Mathematics",
            items: [
                {
                    id: "algebra",
                    icon: Calculator,
                    title: "Algebra",
                    description: "Basic to advanced algebra questions",
                    questionCount: 150
                },
                {
                    id: "geometry",
                    icon: BookOpen,
                    title: "Geometry",
                    description: "Comprehensive geometry problems",
                    questionCount: 120
                },
            ]
        },
        {
            title: "Science",
            items: [
                {
                    id: "physics",
                    icon: Beaker,
                    title: "Physics",
                    description: "Physics concepts and calculations",
                    questionCount: 100
                },
                {
                    id: "chemistry",
                    icon: GraduationCap,
                    title: "Chemistry",
                    description: "Chemical reactions and formulas",
                    questionCount: 80
                }
            ]
        }
    ];

    // 处理题库点击
    const handleBankClick = (bankId: string) => {
        onSelectBank(bankId);
    };

    return (
        <div className={cn("flex flex-col h-full", className)} {...props}>
            <div className="bg-gradient-to-r from-primary/3 to-primary/5 px-5 py-3 border-b">
                <div className="flex items-center gap-2">
                    <Library className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-semibold tracking-tight">Question Bank</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Browse and select questions from our question bank</p>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {bankCategories.map((category) => (
                        <div key={category.title} className="mb-4">
                            <h3 className="text-xs font-medium text-muted-foreground px-2 mb-1">{category.title}</h3>
                            <div className="space-y-1">
                                {category.items.map((item) => (
                                    <button
                                        key={item.id}
                                        className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors text-left"
                                        onClick={() => handleBankClick(item.id)}
                                    >
                                        <div className="bg-primary/10 p-1.5 rounded-md flex-shrink-0">
                                            <item.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
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