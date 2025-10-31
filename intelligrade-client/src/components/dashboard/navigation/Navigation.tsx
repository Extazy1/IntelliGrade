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
    CalendarCheck
} from "lucide-react";
import { NavigationProps } from "./interface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    {
        id: "exams",
        label: "Exam Papers",
        icon: BookOpenText,
    },
    {
        id: "students",
        label: "Students",
        icon: Users,
    },
    {
        id: "classes",
        label: "Classes",
        icon: School,
    },
    {
        id: "schedule",
        label: "Exam Schedule",
        icon: CalendarCheck,
    },
];

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
    return (
        <nav className="flex flex-col gap-2 px-4 py-3">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                    <Button
                        key={item.id}
                        variant="ghost"
                        className={cn(
                            "justify-start gap-3 text-base font-normal py-3 px-4 rounded-lg",
                            activeTab === item.id
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