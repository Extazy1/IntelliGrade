"use client";

import { ExamContent } from "./ExamPaperContent";
import { ContentProps } from "./interface";
import { StudentContent } from "./StudentContent";
import { ClassContent } from "./ClassContent";
import { ExamScheduleContent } from "./ExamScheduleContent";

const Content = ({ activeTab }: ContentProps) => {
    return (
        <div className="flex-1 bg-muted/80">
            <div className="h-full p-2">
                <div className="bg-background rounded-2xl p-6 h-full shadow-sm">
                    {/* 在这里添加内容 */}
                    <div className="h-[100%]">
                        {activeTab === "exams" && <ExamContent />}
                        {activeTab === "students" && <StudentContent />}
                        {activeTab === "classes" && <ClassContent />}
                        {activeTab === "schedule" && <ExamScheduleContent />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Content; 