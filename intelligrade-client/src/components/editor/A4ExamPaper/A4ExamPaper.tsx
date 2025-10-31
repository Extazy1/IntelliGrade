'use client'

import { type A4ExamPaperProps } from "./interface"
import DefaultHeader from "@/components/exam-header-templates";
import MultipleChoiceQuestion from "@/components/questions-type/multiple-choice-question";
import FillInBlankQuestion from "@/components/questions-type/fill-in-blank-question";
import { Blank } from "@/components/layout-components/Blank";
import { nanoid } from "nanoid";
import { OpenQuestion } from "@/components/questions-type/open-question";
import { Divider } from "@/components/layout-components/Divider";
import { ClickDragContainer } from "../ClickDragContainer";
import { useEffect, useRef, useState } from "react";
import { ExamResponse, UnionComponent } from "@/types/exam";
import { cn, isQuestionComponent } from "@/lib/utils";

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const BOTTOM_MARGIN_MM = 10
const MARGIN_TOP_MM = 8.47
const GAP_MM = 9

export function A4ExamPaper({
    exam,
    setExam,
    renderMode,
    pdfMode,
    scale = 1,
    forceUpdate,
    onMCQQuestionChange,
    onMCQOptionChange,
    onFillInBlankContentChange,
    onOpenQuestionChange,
    handleComponentClick,
    handleComponentDelete,
}: A4ExamPaperProps) {
    const containerRef = useRef<HTMLDivElement>(null) // 这个ref是A4纸的容器
    const isUpdatingFromEffect = useRef(false); // 新增：用于标记是否是由effect本身引起的更新
    const [isLoaded, setIsLoaded] = useState(false);

    // 处理组件向上移动
    const handleMoveUp = (componentId: string) => {
        const components = [...exam.examData.components];
        const index = components.findIndex(comp => comp.id === componentId);
        if (index > 0) {
            // 交换当前组件和上一个组件的位置
            const temp = components[index];
            components[index] = components[index - 1];
            components[index - 1] = temp;
            // 更新状态
            const updatedExam: ExamResponse = {
                ...exam,
                examData: {
                    ...exam.examData,
                    components: components
                }
            };
            setExam(updatedExam);
        }
    };

    // 处理组件向下移动
    const handleMoveDown = (componentId: string) => {
        const components = [...exam.examData.components];
        const index = components.findIndex(comp => comp.id === componentId);
        if (index !== -1 && index < components.length - 1) {
            // 交换当前组件和下一个组件的位置
            const temp = components[index];
            components[index] = components[index + 1];
            components[index + 1] = temp;
            // 更新状态
            const updatedExam: ExamResponse = {
                ...exam,
                examData: {
                    ...exam.examData,
                    components: components
                }
            };
            setExam(updatedExam);
        }
    };

    // 计算每一个组件相对于A4纸的相对位置，并更新到组件的position属性中
    useEffect(() => {
        // 如果正在从effect更新，则跳过此次执行
        if (isUpdatingFromEffect.current) {
            isUpdatingFromEffect.current = false;
            return;
        }

        if (containerRef.current) {
            console.log('Calculate position')
            const pages: string[][] = [[]] // 二维数组，每个子数组表示一页，用来计算分页
            let currentPageIndex = 0;
            let currentPageHeight = 0;
            let questionNumber = 1;
            // A4纸的rect
            const a4Rect = containerRef.current.getBoundingClientRect()
            // 计算pixel到mm的转换比例
            const pixelToMMRatio = A4_WIDTH_MM / a4Rect.width
            // 开始遍历所有components，计算position
            const allComponentsWithPosition = [...exam.examData.components].map(component => {
                // 获取组件的DOM元素
                const element = document.querySelector(`[data-component-id="${component.id}"]`) as HTMLElement | null
                if (!element) return component;
                // 获取组件的父容器
                const parentContainer = element.parentElement as HTMLElement
                // 获取组件rect
                const rect = element.getBoundingClientRect()
                // 计算相对位置，并转换到mm
                const topMm = (rect.top - parentContainer.getBoundingClientRect().top) * pixelToMMRatio
                const leftMm = (rect.left - parentContainer.getBoundingClientRect().left) * pixelToMMRatio
                const widthMm = rect.width * pixelToMMRatio
                const heightMm = rect.height * pixelToMMRatio
                // 创建一个组件的副本，并更新position
                const componentWithPosition = {
                    ...component,
                    position: {
                        top: topMm,
                        left: leftMm,
                        width: widthMm,
                        height: heightMm,
                        pageIndex: currentPageIndex
                    }
                }
                // 判断是否是题目组件, 如果是题目组件，则更新questionNumber
                const isQuestion = isQuestionComponent(component)
                if (isQuestion) {
                    // @ts-expect-error some reason
                    componentWithPosition.questionNumber = questionNumber++;
                }
                // 检查当前页面是否还能容纳这个组件
                if ((currentPageHeight + heightMm) > (A4_HEIGHT_MM - BOTTOM_MARGIN_MM)) {
                    // 新建一页, 并把当前组件加入到新页中
                    currentPageIndex++;
                    pages.push([component.id])
                    currentPageHeight = MARGIN_TOP_MM + heightMm + GAP_MM;
                    componentWithPosition.position.pageIndex = currentPageIndex;
                } else {
                    // 添加到当前页
                    pages[currentPageIndex].push(component.id)
                    currentPageHeight += (heightMm + GAP_MM);
                }
                return componentWithPosition;
            })
            // 更新状态前设置标记
            isUpdatingFromEffect.current = true;
            // 更新状态
            const updatedExam: ExamResponse = {
                ...exam,
                examData: {
                    ...exam.examData,
                    components: allComponentsWithPosition as UnionComponent[]
                }
            }
            setExam(updatedExam)
        }
    }, [exam, forceUpdate, isLoaded])

    // 完全加载后1s再更新一次position，确保准确
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Check if document is already complete
            if (document.readyState === 'complete') {
                setTimeout(() => {
                    console.log('Loaded')
                    setIsLoaded(true);
                }, 1000);
            } else {
                // Wait for window load event
                const handleLoad = () => {
                    console.log('Loaded')
                    setTimeout(() => {
                        setIsLoaded(true);
                    }, 1000);
                };
                window.addEventListener('load', handleLoad);
                return () => {
                    window.removeEventListener('load', handleLoad);
                };
            }
        }
    }, []);

    // 计算总页数
    const totalPages = exam.examData.components.length > 0
        ? Math.max(...exam.examData.components.map(comp => comp.position?.pageIndex || 0)) + 1
        : 1;

    // 将组件按页码分组
    const pageComponents = Array.from({ length: totalPages }, (_, i) =>
        exam.examData.components.filter(comp => (comp.position?.pageIndex || 0) === i)
    );

    // 渲染组件函数
    const renderComponent = (item: UnionComponent) => {
        switch (item.type) {
            case 'default-header':
                return (
                    <ClickDragContainer
                        key={item.id}
                        componentId={item.id}
                        onDelete={handleComponentDelete}
                        onClick={() => {
                            handleComponentClick(item.id);
                        }}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                    >
                        <DefaultHeader
                            key={`header-${item.id}`}
                            exam={exam}
                        />
                    </ClickDragContainer>
                );
            case 'multiple-choice':
                return (
                    <ClickDragContainer
                        key={item.id}
                        componentId={item.id}
                        onDelete={handleComponentDelete}
                        onClick={() => {
                            handleComponentClick(item.id);
                        }}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                    >
                        <MultipleChoiceQuestion
                            questionObj={item}
                            onQuestionChange={onMCQQuestionChange}
                            onOptionChange={onMCQOptionChange}
                            renderMode={renderMode}
                            questionNumber={item.questionNumber}
                        />
                    </ClickDragContainer>
                );
            case 'fill-in-blank':
                return (
                    <ClickDragContainer
                        key={item.id}
                        componentId={item.id}
                        onDelete={handleComponentDelete}
                        onClick={() => {
                            handleComponentClick(item.id)
                        }}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                    >
                        <FillInBlankQuestion
                            key={`fill-${item.id}`}
                            questionObj={item}
                            onContentChange={onFillInBlankContentChange}
                            renderMode={renderMode}
                            questionNumber={item.questionNumber}
                        />
                    </ClickDragContainer>
                );
            case 'open':
                return (
                    <ClickDragContainer
                        key={item.id}
                        componentId={item.id}
                        onDelete={handleComponentDelete}
                        onClick={() => {
                            handleComponentClick(item.id)
                        }}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                    >
                        <OpenQuestion
                            key={`open-${item.id}`}
                            questionObj={item}
                            onContentChange={onOpenQuestionChange}
                            renderMode={renderMode}
                            questionNumber={item.questionNumber}
                        />
                    </ClickDragContainer>
                );
            case 'blank':
                return (
                    <ClickDragContainer
                        key={item.id}
                        componentId={item.id}
                        onDelete={handleComponentDelete}
                        onClick={() => {
                            handleComponentClick(item.id)
                        }}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                    >
                        <Blank
                            key={`blank-${item.id}`}
                            lines={item.lines}
                        />
                    </ClickDragContainer>
                );
            case 'divider':
                return (
                    <ClickDragContainer
                        key={item.id}
                        componentId={item.id}
                        onDelete={handleComponentDelete}
                        onClick={() => {
                            handleComponentClick(item.id)
                        }}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                    >
                        <Divider
                            key={`divider-${item.id}`}
                        />
                    </ClickDragContainer>
                );
            default:
                return <div className="text-red-500" key={nanoid()}>Component Not Found</div>
        }
    }

    return (
        <div
            className={cn(
                "transform-scale origin-top-center transition-transform duration-100 ease-out w-fit",
                pdfMode && "mx-auto"
            )}
            style={{
                transform: `scale(${scale})`
            }}
        >
            {/* 渲染多个A4页面 */}
            {pageComponents.map((components, pageIndex) => (
                <div
                    key={`page-${pageIndex}`}
                    ref={pageIndex === 0 ? containerRef : undefined}
                    className={cn(
                        `bg-background w-[${A4_WIDTH_MM}mm] h-[${A4_HEIGHT_MM}mm] mx-auto p-8 shadow-lg mb-8`,
                        pdfMode && `shadow-none bg-white my-0`,
                    )}
                >
                    {components.map(item => renderComponent(item))}
                </div>
            ))}
        </div>
    )
} 