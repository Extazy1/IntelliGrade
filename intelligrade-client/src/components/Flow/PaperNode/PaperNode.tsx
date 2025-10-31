import { Handle, Position } from '@xyflow/react';
import { PaperNodeProps } from './interface';
import Image from 'next/image';
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { BIGGER_HANDLE_STYLE } from '@/lib/flow';

export default function PaperNode({ data }: PaperNodeProps) {
    return (
        <>
            <Card className="shadow-none rounded-md">
                <CardContent className="p-2">
                    <Image
                        className='w-full h-auto rounded-md'
                        src={data.imageUrl}
                        alt="paper"
                        width={550}
                        height={550}
                    />
                </CardContent>
            </Card>
            <Handle style={BIGGER_HANDLE_STYLE} type="source" position={Position.Bottom} />
        </>
    )
}