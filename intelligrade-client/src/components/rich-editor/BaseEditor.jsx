import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import Quill, { Delta } from 'quill';
import 'katex/dist/katex.min.css';
import './quill.css';
import ImageResize from 'quill-image-resize';
import { ResizeModuleConfig } from './ResizeModuleConfig';

// 导入Quill公式模块需要的KaTeX
// 确保全局window.katex可用，这是Quill公式模块所需的
import katex from 'katex';
if (typeof window !== 'undefined') {
    window.katex = katex;
}

/**
 * 重写Quill公式模块的html()方法,为公式添加class
 * 这样在解析html时,可以单独渲染公式
 */
const Formula = Quill.import('formats/formula');
class CustomFormula extends Formula {
    html() {
        const { formula } = this.value();
        return `<span class="latex-formula">${formula}</span>`;
    }
}
Quill.register(CustomFormula, true);

/**
 * 重写Quill图片模块的className来限制图片宽度
 */
const Image = Quill.import('formats/image');
Image.className = 'quill-image';
Quill.register(Image, true);

// 注册图片调整大小模块
Quill.register('modules/imageResize', ImageResize);

// Editor is an uncontrolled React component
const Editor = forwardRef(
    ({ readOnly, defaultValue, onTextChange, onSelectionChange }, ref) => {
        const containerRef = useRef(null);
        const defaultValueRef = useRef(defaultValue);
        const onTextChangeRef = useRef(onTextChange);
        const onSelectionChangeRef = useRef(onSelectionChange);

        useLayoutEffect(() => {
            onTextChangeRef.current = onTextChange;
            onSelectionChangeRef.current = onSelectionChange;
        });

        useEffect(() => {
            ref.current?.enable(!readOnly);
        }, [ref, readOnly]);

        useEffect(() => {
            const container = containerRef.current;
            const editorContainer = container.appendChild(
                container.ownerDocument.createElement('div'),
            );

            const quill = new Quill(editorContainer, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],
                        [{ font: [] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ color: [] }, { background: [] }, 'clean'],
                        ['image', 'formula', 'code'],
                    ],
                    imageResize: ResizeModuleConfig,
                },
            });

            /**
             * 粘贴公式时,将公式转换为Delta对象,正确渲染
             */
            quill.clipboard.addMatcher('.latex-formula', (node) => {
                const formula = node.textContent;
                return new Delta().insert({ formula: formula }, true);
            });

            ref.current = quill;

            if (defaultValueRef.current) {
                quill.setContents(defaultValueRef.current);
            }

            // 暴露 getSemanticHTML 方法到 ref.current
            const originalGetSemanticHTML = quill.getSemanticHTML;
            const originalMethod = originalGetSemanticHTML.bind(quill);
            ref.current.getSemanticHTML = (index = 0, length = quill.getLength() - index) => {
                return originalMethod(index, length);
            };

            quill.on(Quill.events.TEXT_CHANGE, (...args) => {
                onTextChangeRef.current?.(...args);
            });

            quill.on(Quill.events.SELECTION_CHANGE, (...args) => {
                onSelectionChangeRef.current?.(...args);
            });

            return () => {
                ref.current = null;
                container.innerHTML = '';
            };
        }, [ref]);

        return <div ref={containerRef}></div>;
    },
);

Editor.displayName = 'Editor';

export default Editor;