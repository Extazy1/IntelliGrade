import { ReactFlow, Background, Controls, MiniMap, useEdgesState, useNodesState, Panel, addEdge, Connection } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dagre from 'dagre';
import { Edge, Node } from '@xyflow/react';
import { PaperNode } from '@/components/Flow/PaperNode';
import { StudentNode } from '@/components/Flow/StudentNode';
import { MatchDoneProps } from './interface';
import { useTheme } from 'next-themes';
import { generatePaperNodes, generateStudentNodes, generateEdges } from '@/lib/flow';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { startMarkingObjective, updateExamSchedule } from '@/lib/api';
import { cloneDeep } from 'lodash';

const nodeWidth = 500;
const nodeHeight = 300;

export default function MatchDone({ schedule, classData, setSchedule }: MatchDoneProps) {
    const allNodes = [...generatePaperNodes(schedule), ...generateStudentNodes(classData)];
    const allEdges = generateEdges(schedule);
    const [nodes, setNodes, onNodesChange] = useNodesState(allNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(allEdges);
    const nodeTypes = useMemo(() => ({ paper: PaperNode, student: StudentNode }), []);
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(schedule.result.matchResult.done);

    // 计算匹配结果
    const matchedStudents = schedule.result.matchResult.matched.length;
    const totalStudents = classData.students.length;
    const unmatchedStudents = totalStudents - matchedStudents;

    const onConnect = useCallback((params: Connection) => {
        // 如果任何一个node以经连接过，则不连接
        if (edges.some((edge) => edge.source === params.source || edge.target === params.target)) {
            return;
        }
        setEdges((eds) => {
            const paperNodeId = params.source;
            const studentNodeId = params.target;
            // 如果学生节点和试卷节点在unmatched中，则清除unmatched中的两个node，添加到matched
            if (schedule.result.matchResult.unmatched.papers.some((paper) => paper.paperId === paperNodeId)
                && schedule.result.matchResult.unmatched.studentIds.includes(studentNodeId)) {
                const headerImgUrl = schedule.result.matchResult.unmatched.papers.find((paper) => paper.paperId === paperNodeId)?.headerImgUrl ?? '404 Not Found';
                schedule.result.matchResult.unmatched.papers = schedule.result.matchResult.unmatched.papers.filter((paper) => paper.paperId !== paperNodeId);
                schedule.result.matchResult.unmatched.studentIds = schedule.result.matchResult.unmatched.studentIds.filter((id) => id !== studentNodeId);
                schedule.result.matchResult.matched.push({
                    studentId: studentNodeId,
                    paperId: paperNodeId,
                    headerImgUrl
                });
            }
            // 检查是否所有unmatched的papers和studentIds都被匹配了
            if (schedule.result.matchResult.unmatched.papers.length === 0 && schedule.result.matchResult.unmatched.studentIds.length === 0) {
                schedule.result.matchResult.done = true;
                setIsDone(true);
            }
            return addEdge({ ...params, animated: true }, eds);
        });
    }, [edges]);

    // Handle edge deletion
    const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
        // For each deleted edge, update the match result
        deletedEdges.forEach((edge) => {
            // Find the matching in the matched array
            const matchIndex = schedule.result.matchResult.matched.findIndex(
                (match) => match.paperId === edge.source && match.studentId === edge.target
            );

            if (matchIndex !== -1) {
                // Get the match details before removing
                const match = schedule.result.matchResult.matched[matchIndex];

                // Remove from matched
                schedule.result.matchResult.matched.splice(matchIndex, 1);

                // Add back to unmatched
                schedule.result.matchResult.unmatched.papers.push({
                    paperId: match.paperId,
                    headerImgUrl: match.headerImgUrl
                });
                schedule.result.matchResult.unmatched.studentIds.push(match.studentId);

                // Set done to false since we now have unmatched items
                schedule.result.matchResult.done = false;
                setIsDone(false);
            }
        });
    }, []);

    const handleNextStep = async () => {
        setIsLoading(true);
        // 如果所有匹配都完成，则跳转到下一个步骤,更新schedule
        schedule.result.progress = 'OBJECTIVE_START' // 开始客观题评分
        // 根据matched更新papers
        schedule.result.matchResult.matched.forEach((match) => {
            const student = classData.students.find((student) => student.studentId === match.studentId);
            const paperIndex = schedule.result.papers.findIndex((paper) => paper.paperId === match.paperId);
            if (student && paperIndex !== -1) {
                schedule.result.papers[paperIndex].studentId = student.studentId;
                schedule.result.papers[paperIndex].name = student.name;
            }
        });
        // 更新schema
        schedule.result.matchResult.done = true;
        await updateExamSchedule(schedule.documentId, { result: schedule.result }); // 更新schedule
        await startMarkingObjective(schedule.documentId); // 开始客观题评分
        setSchedule(cloneDeep(schedule)); // 更新状态，触发Pipeline组件的重新渲染
        setIsLoading(false);
    }

    // 确保有权限访问主题后再渲染
    useEffect(() => {
        setMounted(true);
    }, []);

    // 初始化时自动应用布局
    useEffect(() => {
        // 默认使用垂直布局 'TB'
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges,
            'TB'
        );

        setNodes([...layoutedNodes] as typeof nodes);
        setEdges([...layoutedEdges] as typeof edges);
    }, []);

    return (
        <div className="w-full h-full">
            <ReactFlow
                edges={edges}
                nodes={nodes}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgesDelete={onEdgesDelete}
                colorMode={mounted && theme === 'dark' ? 'dark' : 'light'}
                fitView // 启用自适应视图
                fitViewOptions={{ padding: 0.5 }} // 增加边距使节点可见性更好
            >
                <Background />
                <Controls />
                <MiniMap />
                <Panel position="bottom-center">
                    <div className="flex gap-2">
                        <Button
                            variant="default"
                            size="default"
                            disabled={!isDone || isLoading}
                            onClick={handleNextStep}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading
                                </>
                            ) : (
                                <>
                                    Next Step <ArrowRight className='w-4 h-4' />
                                </>
                            )}
                        </Button>
                    </div>
                </Panel>
            </ReactFlow>

            {/* 匹配结果对话框 */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-2">
                            <DialogTitle>Match Results</DialogTitle>
                        </div>
                        <DialogDescription>
                            Drag cards and connect them to complete matching
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="font-medium">Matched: {matchedStudents}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                <span className="font-medium">Unmatched: {unmatchedStudents}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setDialogOpen(false)}
                            className="gap-2"
                        >
                            Continue <ArrowRight className='w-4 h-4' />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}

// Helper function to get layout
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    // Create a new directed graph
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // 设置节点之间的间距
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 200, // 水平间距
        ranksep: 300  // 垂直间距 - 增加这个值使节点上下间距更大
    });

    // Set nodes with actual dimensions
    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    // Set edges
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate the layout
    dagre.layout(dagreGraph);

    // Update node positions
    const layoutedNodes = nodes.map((node) => {
        const dagreNode = dagreGraph.node(node.id);

        return {
            ...node,
            position: {
                x: dagreNode.x - nodeWidth / 2,
                y: dagreNode.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};