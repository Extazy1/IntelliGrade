"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/sidebar/Sidebar";
import PersonalizedFeedbackContent from "@/components/dashboard/content/PersonalizedFeedbackContent";

export default function PersonalizedFeedbackPage() {
    const [activeTab, setActiveTab] = useState<string>("personalized-feedback");

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 bg-muted/80">
                <div className="h-full p-2">
                    <div className="bg-background rounded-2xl p-6 h-full shadow-sm">
                        <PersonalizedFeedbackContent />
                    </div>
                </div>
            </div>
        </div>
    );
}

