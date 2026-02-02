import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Set the runtime to edge for best performance
export const runtime = 'edge';

export async function POST(req: Request) {
    const { messages } = await req.json();

    // If no API key is found, return a helpful error message via the stream
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return new Response(
            JSON.stringify({ error: 'AI API 키가 설정되지 않았습니다. .env.local 파일에 GOOGLE_GENERATIVE_AI_API_KEY를 추가해주세요.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const result = streamText({
        model: google('gemini-1.5-pro-latest'),
        messages,
    });

    return result.toUIMessageStreamResponse();
}
