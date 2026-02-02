import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathComponent = ({ node, updateAttributes, selected }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [latex, setLatex] = useState(node.attrs.latex || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selected && !isEditing) {
            // Keep it as is
        } else if (!selected) {
            setIsEditing(false);
        }
    }, [selected]);

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        updateAttributes({ latex });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
            updateAttributes({ latex });
        }
    };

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const renderedMath = React.useMemo(() => {
        try {
            return katex.renderToString(latex || '\\text{수식을 입력하세요}', {
                throwOnError: false,
                displayMode: node.attrs.display,
            });
        } catch (e) {
            return latex;
        }
    }, [latex, node.attrs.display]);

    return (
        <NodeViewWrapper className={`inline-block ${node.attrs.display ? 'block my-4 w-full text-center' : 'inline-block mx-1'}`}>
            <div
                onDoubleClick={handleDoubleClick}
                className={`cursor-pointer transition-all rounded px-1 group relative ${selected ? 'ring-2 ring-brand ring-offset-1 bg-brand/5' : 'hover:bg-muted'
                    }`}
            >
                {isEditing ? (
                    <div className="flex items-center gap-2 bg-background border border-brand/30 rounded px-2 py-1 shadow-lg z-10">
                        <span className="text-xs font-mono text-brand opacity-60">$</span>
                        <input
                            ref={inputRef}
                            className="bg-transparent outline-none py-0.5 text-sm font-mono min-w-[100px]"
                            value={latex}
                            onChange={(e) => setLatex(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                        <span className="text-xs font-mono text-brand opacity-60">$</span>
                    </div>
                ) : (
                    <div
                        dangerouslySetInnerHTML={{ __html: renderedMath }}
                        className={`${node.attrs.display ? 'py-4' : 'inline-block align-middle'}`}
                    />
                )}

                {!isEditing && !latex && (
                    <span className="text-muted-foreground text-xs opacity-50 italic">
                        수식을 입력하려면 더블 클릭
                    </span>
                )}
            </div>
        </NodeViewWrapper>
    );
};

export const MathNode = Node.create({
    name: 'math',
    group: 'inline',
    inline: true,
    selectable: true,
    draggable: true,
    atom: true,

    addAttributes() {
        return {
            latex: {
                default: '',
            },
            display: {
                default: false,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-latex]',
                getAttrs: (element: any) => ({
                    latex: element.getAttribute('data-latex'),
                    display: element.getAttribute('data-display') === 'true',
                }),
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-latex': node.attrs.latex,
                'data-display': node.attrs.display,
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(MathComponent);
    },

    addInputRules() {
        return [
            nodeInputRule({
                find: /\$([^$]+)\$/,
                type: this.type,
                getAttributes: (match) => ({
                    latex: match[1],
                }),
            }),
        ];
    },
});
