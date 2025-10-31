import { Handle, Position } from '@xyflow/react';
import { StudentNodeProps } from './interface';
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { BIGGER_HANDLE_STYLE } from '@/lib/flow';

export default function StudentNode({ data }: StudentNodeProps) {
    return (
        <>
            <Handle style={BIGGER_HANDLE_STYLE} type="target" position={Position.Top} />
            <Card className="w-[250px] shadow-none rounded-md">
                <CardContent className="p-2">
                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium">{data.studentName}</p>
                        <p className="text-sm text-gray-500">{data.studentId}</p>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}