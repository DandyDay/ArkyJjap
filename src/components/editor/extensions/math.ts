import { Extension, Node, mergeAttributes } from '@tiptap/core';
import {
    mathPlugin,
    mathSelectPlugin,
    makeInlineMathInputRule,
    makeBlockMathInputRule,
    REGEX_INLINE_MATH_DOLLARS,
    REGEX_BLOCK_MATH_DOLLARS
} from '@benrbray/prosemirror-math';

export const MathInline = Node.create({
    name: 'math_inline',
    group: 'inline math',
    content: 'text*',
    inline: true,
    atom: true,

    parseHTML() {
        return [
            {
                tag: 'math-inline',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['math-inline', mergeAttributes(HTMLAttributes), 0];
    },

    addInputRules() {
        return [
            makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS, this.type)
        ];
    }
});

export const MathDisplay = Node.create({
    name: 'math_display',
    group: 'block math',
    content: 'text*',
    atom: true,
    code: true,

    parseHTML() {
        return [
            {
                tag: 'math-display',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['math-display', mergeAttributes(HTMLAttributes), 0];
    },

    addInputRules() {
        return [
            makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, this.type)
        ];
    }
});

export const MathExtension = Extension.create({
    name: 'math_extension',

    addProseMirrorPlugins() {
        return [
            mathPlugin,
            mathSelectPlugin,
        ];
    },
});
