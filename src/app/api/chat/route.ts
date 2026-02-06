import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages } from 'ai';
import { tool } from '@ai-sdk/provider-utils';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const MODELS = {
    'openai/gpt-oss-120b': () => groq('openai/gpt-oss-120b'),
    'qwen/qwen3-32b': () => groq('qwen/qwen3-32b'),
    'gpt-4o-mini': () => openai('gpt-4o-mini'),
    'gpt-4o': () => openai('gpt-4o'),
    'gemini-2.0-flash': () => google('gemini-2.0-flash'),
    'gemini-1.5-pro': () => google('gemini-1.5-pro'),
} as const;

type ModelId = keyof typeof MODELS;

export async function POST(req: Request) {
    // 인증 확인
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return new Response(
            JSON.stringify({ error: '인증이 필요합니다.' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const { messages: uiMessages, canvasId, agentMode = false, model: modelId = 'openai/gpt-oss-120b' } = await req.json();

    // Check for API keys based on model
    const isOpenAIModel = modelId.startsWith('gpt') || modelId.startsWith('openai/');
    const isGoogleModel = modelId.startsWith('gemini');
    const isGroqModel = modelId.startsWith('qwen');

    if (isOpenAIModel && !process.env.OPENAI_API_KEY) {
        return new Response(
            JSON.stringify({ error: 'OpenAI API 키가 설정되지 않았습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    if (isGoogleModel && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return new Response(
            JSON.stringify({ error: 'Google AI API 키가 설정되지 않았습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    if (isGroqModel && !process.env.GROQ_API_KEY) {
        return new Response(
            JSON.stringify({ error: 'Groq API 키가 설정되지 않았습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const getModel = MODELS[modelId as ModelId];
    if (!getModel) {
        return new Response(
            JSON.stringify({ error: `지원하지 않는 모델입니다: ${modelId}` }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const messages = await convertToModelMessages(uiMessages);

    const createNoteTool = tool({
        description: '캔버스에 새로운 노트를 생성합니다.',
        inputSchema: z.object({
            title: z.string().describe('노트의 제목'),
            content: z.string().describe('노트의 내용 (마크다운 형식 가능)'),
            positionX: z.number().optional().describe('노트의 X 좌표 (기본값: 랜덤)'),
            positionY: z.number().optional().describe('노트의 Y 좌표 (기본값: 랜덤)'),
            color: z.enum(['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']).optional().describe('노트 색상'),
        }),
        execute: async ({ title, content, positionX, positionY, color }) => {
            if (!canvasId) {
                return { success: false, error: 'Canvas ID가 제공되지 않았습니다.' };
            }

            try {
                const tiptapContent = {
                    type: 'doc',
                    content: [
                        {
                            type: 'heading',
                            attrs: { level: 2 },
                            content: [{ type: 'text', text: title }]
                        },
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: content }]
                        }
                    ]
                };

                const { data, error } = await supabase
                    .from('notes')
                    .insert({
                        canvas_id: canvasId,
                        user_id: user.id,
                        title,
                        content: tiptapContent,
                        position_x: positionX ?? Math.random() * 600 + 100,
                        position_y: positionY ?? Math.random() * 400 + 100,
                        width: 350,
                        height: 250,
                        color: color || 'default',
                        z_index: Date.now(),
                    })
                    .select()
                    .single();

                if (error) throw error;

                return {
                    success: true,
                    noteId: data.id,
                    message: `"${title}" 노트가 성공적으로 생성되었습니다.`,
                    action: 'create',
                    note: data
                };
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return { success: false, error: errorMessage };
            }
        }
    });

    const updateNoteTool = tool({
        description: '기존 노트의 내용을 수정합니다.',
        inputSchema: z.object({
            noteId: z.string().describe('수정할 노트의 ID'),
            title: z.string().optional().describe('새로운 제목'),
            content: z.string().optional().describe('새로운 내용'),
            color: z.enum(['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']).optional().describe('새로운 색상'),
        }),
        execute: async ({ noteId, title, content, color }) => {
            try {
                const { data: currentNote, error: fetchError } = await supabase
                    .from('notes')
                    .select('*')
                    .eq('id', noteId)
                    .eq('canvas_id', canvasId)
                    .single();

                if (fetchError) throw fetchError;

                const updates: Record<string, unknown> = {};
                const changes: { before: Record<string, unknown>; after: Record<string, unknown> } = { before: {}, after: {} };

                if (title !== undefined) {
                    changes.before.title = currentNote.title;
                    changes.after.title = title;
                    updates.title = title;
                }

                if (content !== undefined) {
                    changes.before.content = currentNote.content;
                    const tiptapContent = {
                        type: 'doc',
                        content: [
                            {
                                type: 'paragraph',
                                content: [{ type: 'text', text: content }]
                            }
                        ]
                    };
                    updates.content = tiptapContent;
                    changes.after.content = tiptapContent;
                }

                if (color !== undefined) {
                    changes.before.color = currentNote.color;
                    changes.after.color = color;
                    updates.color = color;
                }

                const { data, error } = await supabase
                    .from('notes')
                    .update(updates)
                    .eq('id', noteId)
                    .eq('canvas_id', canvasId)
                    .select()
                    .single();

                if (error) throw error;

                return {
                    success: true,
                    noteId,
                    message: `노트가 성공적으로 수정되었습니다.`,
                    action: 'update',
                    changes,
                    note: data
                };
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return { success: false, error: errorMessage };
            }
        }
    });

    const deleteNoteTool = tool({
        description: '노트를 삭제합니다. 사용자가 노트 삭제를 명시적으로 요청할 때만 사용하세요.',
        inputSchema: z.object({
            noteId: z.string().describe('삭제할 노트의 ID'),
        }),
        execute: async ({ noteId }) => {
            try {
                const { data: note, error: fetchError } = await supabase
                    .from('notes')
                    .select('title')
                    .eq('id', noteId)
                    .eq('canvas_id', canvasId)
                    .single();

                if (fetchError) throw fetchError;

                const { error } = await supabase
                    .from('notes')
                    .delete()
                    .eq('id', noteId)
                    .eq('canvas_id', canvasId);

                if (error) throw error;

                return {
                    success: true,
                    noteId,
                    message: `"${note.title || '제목 없음'}" 노트가 삭제되었습니다.`,
                    action: 'delete'
                };
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return { success: false, error: errorMessage };
            }
        }
    });

    const listNotesTool = tool({
        description: '현재 캔버스의 모든 노트 목록을 가져옵니다.',
        inputSchema: z.object({}),
        execute: async () => {
            if (!canvasId) {
                return { success: false, error: 'Canvas ID가 제공되지 않았습니다.' };
            }

            try {
                const { data, error } = await supabase
                    .from('notes')
                    .select('id, title, color, position_x, position_y')
                    .eq('canvas_id', canvasId)
                    .order('z_index', { ascending: true });

                if (error) throw error;

                return {
                    success: true,
                    notes: data.map((n: { id: string; title: string; color: string; position_x: number; position_y: number }) => ({
                        id: n.id,
                        title: n.title || '제목 없음',
                        color: n.color,
                        position: { x: n.position_x, y: n.position_y }
                    })),
                    message: `총 ${data.length}개의 노트가 있습니다.`
                };
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return { success: false, error: errorMessage };
            }
        }
    });

    const systemPrompt = agentMode
        ? `당신은 Arky 캔버스 어시스턴트입니다. 사용자의 캔버스에서 노트를 생성, 수정, 삭제할 수 있는 능력이 있습니다.

핵심 규칙:
1. 사용자가 새 노트나 섹션 추가를 요청하면 createNote 도구를 사용하세요.
2. 사용자가 기존 노트 수정을 요청하면 먼저 listNotes로 ID를 확인한 후 updateNote를 사용하세요.
3. 삭제는 사용자가 명시적으로 요청할 때만 수행하세요.
4. 모든 작업 후 수행한 내용을 한국어로 친절하게 설명하세요.
5. 노트 내용은 마크다운 형식으로 작성하면 좋습니다.

사용자에게 친근하고 도움이 되는 어시스턴트가 되어주세요.`
        : `당신은 Arky의 AI 어시스턴트입니다. 사용자의 노트 작성과 아이디어 구상을 도와주세요.
한국어로 친절하고 도움이 되는 응답을 제공하세요.
필요한 경우 마크다운 형식을 사용하여 구조화된 답변을 제공할 수 있습니다.`;

    const agentTools = {
        createNote: createNoteTool,
        updateNote: updateNoteTool,
        deleteNote: deleteNoteTool,
        listNotes: listNotesTool,
    };

    const result = streamText({
        model: getModel(),
        system: systemPrompt,
        messages,
        tools: agentMode ? agentTools : undefined,
    });

    return result.toUIMessageStreamResponse();
}
