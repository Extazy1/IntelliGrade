"use client";

import {
    BookOpenText,
    Users,
    CreditCard,
    PlusCircle,
    Folder,
    Share,
    UserCircle,
    School,
    CalendarCheck,
    MessageSquare,
    FileText,
    ClipboardCheck
} from "lucide-react";
import { NavigationProps } from "./interface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    {
        id: "exams",
        label: "Exam Papers",
        icon: BookOpenText,
        href: "/dashboard",
    },
    {
        id: "students",
        label: "Students",
        icon: Users,
        href: "/dashboard",
    },
    {
        id: "classes",
        label: "Classes",
        icon: School,
        href: "/dashboard",
    },
    {
        id: "schedule",
        label: "Exam Schedule",
        icon: CalendarCheck,
        href: "/dashboard",
    },
    {
        id: "chatbox",
        label: "Chatbox",
        icon: MessageSquare,
        href: "/dashboard/chatbox",
    },
    {
        id: "generate-material",
        label: "Generate Materials",
        icon: FileText,
        href: "/dashboard/generate-material",
    },
    {
        id: "personalized-feedback",
        label: "Personalized Feedback",
        icon: ClipboardCheck,
        href: "/dashboard/personalized-feedback",
    },
];

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
    return (
        <nav className="flex flex-col gap-2 px-4 py-3">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                // If item has href, use link navigation; otherwise use onClick
                if (item.href && item.href !== "/dashboard") {
                    return (
                        <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                                "justify-start gap-3 text-base font-normal py-3 px-4 rounded-lg",
                                isActive
                                    ? "bg-background/90 text-foreground font-medium shadow-sm hover:bg-background/90"
                                    : "text-foreground/70 hover:text-foreground hover:bg-background/60"
                            )}
                            asChild
                        >
                            <a href={item.href}>
                                <Icon className="h-5 w-5" strokeWidth={2.5} />
                                <span>{item.label}</span>
                            </a>
                        </Button>
                    );
                }
                
                return (
                    <Button
                        key={item.id}
                        variant="ghost"
                        className={cn(
                            "justify-start gap-3 text-base font-normal py-3 px-4 rounded-lg",
                            isActive
                                ? "bg-background/90 text-foreground font-medium shadow-sm hover:bg-background/90"
                                : "text-foreground/70 hover:text-foreground hover:bg-background/60"
                        )}
                        onClick={() => onTabChange(item.id)}
                    >
                        <Icon className="h-5 w-5" strokeWidth={2.5} />
                        <span>{item.label}</span>
                    </Button>
                );
            })}
        </nav>
    );
};

export default Navigation; 