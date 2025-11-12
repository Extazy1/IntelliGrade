"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/sidebar/Sidebar";
import ChatboxContent from "@/components/dashboard/content/ChatboxContent";

export default function ChatboxPage() {
    const [activeTab, setActiveTab] = useState<string>("chatbox");

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 bg-muted/80">
                <div className="h-full p-2">
                    <div className="bg-background rounded-2xl h-full shadow-sm overflow-hidden">
                        <ChatboxContent />
                    </div>
                </div>
            </div>
        </div>
    );
}

