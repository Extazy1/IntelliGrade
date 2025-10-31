import { ReactFlow, useEdgesState, useNodesState, Controls, Background, MiniMap, Panel, Node, Edge } from "@xyflow/react";
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { AllQuestionsFlowProps } from "./interface";
import { QuestionNode } from "@/components/Flow/QuestionNode";
import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { ExamSchedule } from "@/types/types";
import { MultipleChoiceQuestionData } from "@/types/exam";
import dagre from 'dagre';

export default function AllQuestionsFlow({ handleNextStep, schedule }: AllQuestionsFlowProps) {
    const nodeTypes = useMemo(() => ({
        question: QuestionNode,
    }), []);
    const [nodes, setNodes, onNodesChange] = useNodesState(getNodes(schedule));
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [nodeSize, setNodeSize] = useState({ width: 500, height: 150 });
    const [isLoading, setIsLoading] = useState(false);
    const initialized = useRef(false);
    const reactFlowRef = useRef(null);

    // 应用布局
    const onLayout = useCallback((direction: 'TB' | 'LR') => {
        if (!nodes.length) return;

        // 获取节点实际尺寸
        const flowNodes = document.querySelectorAll('.react-flow__node');
        if (flowNodes.length > 0) {
            // 获取第一个节点的尺寸作为参考
            const nodeElement = flowNodes[0];
            const { width, height } = nodeElement.getBoundingClientRect();

            // 使用实际测量的尺寸
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                nodes,
                edges,
                direction,
                width,
                height
            );

            setNodes([...layoutedNodes] as typeof nodes);
            setEdges([...layoutedEdges] as typeof edges);
        } else {
            // 如果没有找到节点元素，使用默认尺寸
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                nodes,
                edges,
                direction,
                nodeSize.width,
                nodeSize.height
            );

            setNodes([...layoutedNodes] as typeof nodes);
            setEdges([...layoutedEdges] as typeof edges);
        }
    }, [nodes, edges, nodeSize]);

    // 包装handleNextStep函数以添加加载状态
    const handleNextStepWithLoading = async () => {
        setIsLoading(true);
        try {
            await handleNextStep();
        } finally {
            setIsLoading(false);
        }
    };

    // 组件挂载后延迟应用布局
    useEffect(() => {
        // 等待DOM渲染完成
        const timer = setTimeout(() => {
            if (!initialized.current) {
                onLayout('LR');
                initialized.current = true;
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [onLayout]);

    return (
        <div className="w-full h-full">
            <ReactFlow
                ref={reactFlowRef}
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                fitViewOptions={{ padding: 0.2 }}
            >
                <Controls />
                <Background color="#aaa" gap={16} />
                <MiniMap />
                <Panel position="bottom-center">
                    <div className="flex gap-2">
                        <Button
                            variant="default"
                            size="default"
                            disabled={!schedule.result.matchResult.done || isLoading}
                            onClick={handleNextStepWithLoading}
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
        </div>
    )
}

// 定义dagre图形布局函数
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB', nodeWidth = 250, nodeHeight = 150) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // 设置布局方向和节点间距
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 5,
        ranksep: 5,
        marginx: 50,
        marginy: 5
    });

    // 添加节点到dagre图形
    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    // 添加边到dagre图形
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // 计算布局
    dagre.layout(dagreGraph);

    // 获取新的节点位置
    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: newNodes, edges };
};

function getNodes(schedule: ExamSchedule) {
    const nodes: Node[] = [];
    schedule.exam.examData.components.forEach((component: MultipleChoiceQuestionData) => {
        if (component.type === 'multiple-choice') {
            nodes.push({
                id: component.id,
                type: 'question',
                data: {
                    questionId: component.id,
                    schedule: schedule,
                },
                position: { x: 0, y: 0 },
                draggable: false,
            });
        }
    });
    return nodes;
}
