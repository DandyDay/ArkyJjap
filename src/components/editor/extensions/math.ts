import { Extension, Node, mergeAttributes, InputRule } from '@tiptap/core';
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
        // Cast to unknown first to avoid type incompatibility between prosemirror-math and tiptap
        return [
            makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS, this.type) as unknown as InputRule
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
        // Cast to unknown first to avoid type incompatibility between prosemirror-math and tiptap
        return [
            makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, this.type) as unknown as InputRule
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
