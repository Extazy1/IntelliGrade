"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Content } from "./content";

const DashboardLayout = () => {
    const [activeTab, setActiveTab] = useState<string>("exams");

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
            <Content activeTab={activeTab} />
        </div>
    );
};

export default DashboardLayout; 