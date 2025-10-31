'use client'

import { type CanvasProps } from "./interface"
import { useState, useCallback, useRef, useEffect } from "react"
import { ZoomIn, ZoomOut, Eye, Pen, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { A4ExamPaper } from "@/components/editor/A4ExamPaper"
import { useToast } from "@/hooks/use-toast"

// A4 paper dimensions in millimeters
const A4_WIDTH_MM = 210 // A4 width in mm

export function Canvas({ exam, renderMode,
    setExam,
    onOpenQuestionChange,
    onRenderModeChange,
    onMCQQuestionChange,
    onMCQOptionChange,
    handleComponentClick,
    handleComponentDelete,
    onFillInBlankContentChange, ...props }: CanvasProps) {
    const [scale, setScale] = useState(1)
    const [forceUpdate, setForceUpdate] = useState(true)
    const containerRef = useRef<HTMLDivElement>(null)
    const MIN_SCALE = 0.1
    const MAX_SCALE = 2
    const SCALE_STEP = 0.1
    const { toast } = useToast()

    // Copy exam JSON to clipboard
    const copyExamToClipboard = useCallback(() => {
        const examJson = JSON.stringify(exam, null, 2)
        navigator.clipboard.writeText(examJson)
            .then(() => {
                toast({
                    title: "Copied to clipboard",
                    duration: 1000,
                })
            })
    }, [exam, toast])

    // Calculate scale to fit the A4 paper in the container
    const calculateAutoScale = useCallback(() => {
        if (!containerRef.current) return 1

        const padding = 10 // 10px on each side
        const containerWidth = containerRef.current.clientWidth - padding * 2

        // Create a temporary div to measure mm to px conversion
        // 不知道屏幕dpi，所以先用CSS的mm单位来创建一个隐藏的A4大小div
        // 再通过getBoundingClientRect()获取在这块屏幕上对应多少px
        const temp = document.createElement('div')
        temp.style.width = `${A4_WIDTH_MM}mm`
        temp.style.position = 'absolute'
        temp.style.visibility = 'hidden'
        document.body.appendChild(temp)

        // Get the actual width in pixels
        const a4WidthInPx = temp.getBoundingClientRect().width
        document.body.removeChild(temp)

        // Calculate scale based on width ratio
        const widthScale = containerWidth / a4WidthInPx

        // When container width > A4 width
        if (widthScale > 1) {
            return 1 // 100%
        }

        // Ensure the scale is within bounds
        return Math.min(Math.max(widthScale, MIN_SCALE), MAX_SCALE)
    }, [])

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setScale(calculateAutoScale())
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [calculateAutoScale])

    // Set scale to auto when component mounts
    useEffect(() => {
        setScale(calculateAutoScale())
    }, [calculateAutoScale])

    // Press ctrl or command or shift to zoom in and out
    const handleWheel = useCallback((e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
            e.preventDefault()
            setScale(prev => {
                const newScale = prev - (e.deltaY * 0.005)
                return Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE)
            })
        }
    }, [])

    // 点击空白区域，取消选中组件
    const handleClickCanvaOuterArea = () => {
        handleComponentClick(null)
        setForceUpdate(!forceUpdate)
    }

    // 点击切换预览模式
    const handleRenderModeClick = () => {
        onRenderModeChange(!renderMode)
        setForceUpdate(!forceUpdate)
    }

    // Add non-passive wheel event listener
    useEffect(() => {
        const element = containerRef.current
        if (!element) return

        element.addEventListener('wheel', handleWheel as unknown as EventListener, { passive: false })
        return () => {
            element.removeEventListener('wheel', handleWheel as unknown as EventListener)
        }
    }, [handleWheel])

    const adjustScale = (delta: number) => {
        setScale(prev => {
            const newScale = prev + delta
            return Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE)
        })
    }

    return (
        <div
            className={"bg-muted/50 flex flex-col h-full"}
        >
            <div className="flex items-center justify-between gap-2 p-2 border-b sticky top-0 bg-background z-10">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={handleRenderModeClick}
                    >
                        {renderMode ? (
                            <>
                                <Pen className="h-4 w-4" />
                                <span>Edit</span>
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4" />
                                <span>Preview</span>
                            </>
                        )}
                    </Button>
                    {/* <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={copyExamToClipboard}
                    >
                        <FileJson className="h-4 w-4" />
                        <span>Copy JSON</span>
                    </Button> */}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setScale(calculateAutoScale())}
                    >
                        <span className="text-sm">Auto</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => adjustScale(-SCALE_STEP)}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[3rem] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => adjustScale(SCALE_STEP)}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div
                ref={containerRef}
                className="flex-1 overflow-auto p-8 flex items-start justify-center"
                onClick={(e) => {
                    if (e.currentTarget === e.target) {
                        handleClickCanvaOuterArea()
                    }
                }}
            >
                <A4ExamPaper
                    exam={exam}
                    pdfMode={false}
                    setExam={setExam}
                    renderMode={renderMode}
                    scale={scale}
                    forceUpdate={forceUpdate}
                    onMCQQuestionChange={onMCQQuestionChange}
                    onMCQOptionChange={onMCQOptionChange}
                    onFillInBlankContentChange={onFillInBlankContentChange}
                    onOpenQuestionChange={onOpenQuestionChange}
                    handleComponentClick={handleComponentClick}
                    handleComponentDelete={handleComponentDelete}
                />
            </div>
        </div>
    )
} 