import { ReactNode } from 'react';

export interface ClickDragContainerProps {
    children: ReactNode;
    onClick: (componentId: string) => void;
    componentId: string;
    onDelete: (componentId: string) => void;
    onMoveUp: (componentId: string) => void;
    onMoveDown: (componentId: string) => void;
    // 将来可以添加拖拽相关属性
}