'use client'

import React from 'react'
import { DefaultHeaderProps } from './interface'

export function DefaultHeader({
    exam,
}: DefaultHeaderProps) {
    return (
        <div className="">
            {/* Header Section */}
            <div className="mb-8">
                {/* Top Row - School Name and Date */}
                <div className="flex justify-between mb-6">
                    <div className="text-xl font-bold uppercase">{exam.examData.university}</div>
                    <div className="text-xl">{exam.examData.examDate}</div>
                </div>

                {/* Student Information */}
                <div className="flex items-center gap-8 mb-5">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center">
                            <div className="text-lg font-bold mr-2">NAME :</div>
                            <div className="border-b-2 border-black dark:border-white flex-grow min-h-[1.5rem]"></div>
                        </div>
                        <div className="flex items-center">
                            <div className="text-lg font-bold mr-2">STUDENT ID :</div>
                            <div className="border-b-2 border-black dark:border-white flex-grow min-h-[1.5rem]"></div>
                        </div>
                    </div>

                    {/* Academic Information Box */}
                    <div className="flex-1 border-2 border-black dark:border-white flex flex-col items-center justify-center p-4">
                        <div className="text-xl">
                            <span className="font-bold">Year:</span> {exam.examData.year}
                        </div>
                        <div className="text-xl">
                            <span className="font-bold">Semester:</span> {exam.examData.semester}
                        </div>
                        <div className="text-xl">
                            <span className="font-bold">Duration:</span> {exam.examData.duration}
                        </div>
                    </div>
                </div>

                {/* Course Information */}
                <div className="mb-4">
                    <div className="text-lg">{exam.examData.title}</div>
                    <div className="flex items-start flex-col">
                        <div className="text-5xl font-bold uppercase tracking-tight mr-4">{exam.examData.course}</div>
                        <div className="text-lg">{exam.examData.description}</div>
                    </div>
                </div>

                {/* Instructions Box */}
                <div className="border-2 border-black dark:border-white p-4 mt-4">
                    <div className="text-xl italic font-semibold mb-2">Instructions :</div>
                    <ul className="list-disc pl-6 space-y-2">
                        <li className="italic">Please answer all questions clearly and legibly.</li>
                        <li className="italic">For multiple choice questions, select the best answer by circling or marking the correct option.</li>
                        <li className="italic">For fill-in-the-blank questions, write your answers clearly in the provided spaces.</li>
                        <li className="italic">Show all your work for calculation problems. Both your process and final answer will be evaluated.</li>
                    </ul>
                </div>
            </div>
        </div>
    )
} 