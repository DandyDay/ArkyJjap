import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Code,
    Minus,
    Type,
    Image,
    Sigma,
} from 'lucide-react';
import { CommandList } from '../command-list';

export default {
    items: ({ query }: { query: string }) => {
        return [
            {
                title: '본문',
                description: '일반 텍스트를 작성합니다.',
                icon: <Type className="h-3 w-3" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setParagraph().run();
                },
            },
            {
                title: '제목 1',
                description: '가장 큰 제목입니다.',
                icon: <Heading1 className="h-3 w-3" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
                },
            },
            {
                title: '제목 2',
                description: '중간 크기 제목입니다.',
                icon: <Heading2 className="h-3 w-3" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
                },
            },
            {
                title: '제목 3',
                description: '작은 크기 제목입니다.',
                icon: <Heading3 className="h-3 w-3" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
                },
            },
            {
                title: '이미지 (Image)',
                description: 'URL로 이미지를 삽입합니다. (image, img)',
                icon: <Image className="h-3 w-3" />,
                command: ({ editor, range }: any) => {
                    const url = window.prompt('이미지 URL을 입력하세요');
                    if (url) {
                        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
                    }
                },
            },
            {
                title: '수식 (Math Equation)',
                description: 'LaTeX 수식을 삽입합니다. (math, formula)',
                icon: <Sigma className="h-3 w-3" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).insertContent('$ ').run();
                },
            },
            {
                title: '글머리 기호',
                description: '불렛 리스트를 시작합니다.',
                icon: <List className="h-3 w-3" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleBulletList().run();
                },
            },
            {
                title: '번호 목록',
                description: '번호 리스트를 시작합니다.',
                icon: <ListOrdered className="h-3 w-3" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
                },
            },
            {
                title: '할 일 목록',
                description: '체크리스트를 시작합니다. (task, todo)',
                icon: <CheckSquare className="h-3 w-3" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleTaskList().run();
                },
            },
            {
                title: '인용구',
                description: '인용문을 작성합니다. (quote)',
                icon: <Quote className="h-3 w-3" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleBlockquote().run();
                },
            },
            {
                title: '코드 블록',
                description: '코드 구문을 작성합니다. (code)',
                icon: <Code className="h-3 w-3" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
                },
            },
            {
                title: '구분선',
                description: '섹션을 구분합니다. (divider, hr)',
                icon: <Minus className="h-3 w-3" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setHorizontalRule().run();
                },
            },
        ].filter(item => {
            const searchStr = `${item.title} ${item.description}`.toLowerCase();
            return searchStr.includes(query.toLowerCase());
        });
    },

    render: () => {
        let component: any;
        let popup: any;

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(CommandList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                })[0];
            },

            onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                    return;
                }

                popup.setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup.hide();
                    return true;
                }

                return component.ref?.onKeyDown(props);
            },

            onExit() {
                popup.destroy();
                component.destroy();
            },
        };
    },
};
