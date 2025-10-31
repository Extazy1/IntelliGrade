export interface RichInputProps {
    /**
     * 初始HTML内容
     */
    initialContent: string;

    /**
     * 内容变更回调
     */
    onContentChange: (html: string) => void;

    /**
     * 编辑器失焦回调
     */
    onBlur?: () => void;

    /**
     * 自定义样式类名
     */
    className?: string;
} 