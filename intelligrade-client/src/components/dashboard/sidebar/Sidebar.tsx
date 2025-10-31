"use client";

import { UserProfile } from "../user-profile";
import { Navigation } from "../navigation";
import { SidebarProps } from "./interface";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Home, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex flex-col h-full w-64 bg-muted/80">
            <div className="pt-5 pb-2 px-4">
                <UserProfile />
            </div>
            <Separator className="w-[90%] mx-auto bg-border/90" />
            <div className="flex-1 overflow-y-auto">
                <Navigation activeTab={activeTab} onTabChange={onTabChange} />
                <Separator className="w-[90%] mx-auto bg-border/90 mb-1" />
                <div className="flex justify-between items-center px-4 py-3 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                    >
                        <a href="/">
                            <Home className="mr-1 h-4 w-4" />
                            Home
                        </a>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    >
                        <div className="relative w-4 h-4 mr-2">
                            <Sun className="absolute inset-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute inset-0 rotate-0 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </div>
                        <span>Theme</span>
                    </Button>
                </div>
            </div>
            <div className="p-4 flex justify-between items-center border-t border-border/40">
                <span className="text-xs text-muted-foreground">IntelliGrade 2025 @ Group10</span>
            </div>
        </div>
    );
};

export default Sidebar; 