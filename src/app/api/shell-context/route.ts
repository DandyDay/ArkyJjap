import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import os from 'os';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
    // 인증 확인
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const projectRoot = process.cwd();

        const systemInfo = {
            os: `${os.type()} ${os.release()} (${os.arch()})`,
            nodeVersion: process.version,
            platform: process.platform,
        };

        const getFileTree = (dir: string, depth = 0): string[] => {
            if (depth > 2) return [];
            try {
                const files = fs.readdirSync(dir);
                let result: string[] = [];
                for (const file of files) {
                    if (file === 'node_modules' || file === '.git' || file === '.next' || file === '.env.local') continue;
                    const fullPath = path.join(dir, file);
                    const isDirectory = fs.statSync(fullPath).isDirectory();
                    result.push(`${'  '.repeat(depth)}${isDirectory ? '>' : '-'} ${file}`);
                    if (isDirectory && depth < 1) {
                        result = [...result, ...getFileTree(fullPath, depth + 1)];
                    }
                }
                return result;
            } catch {
                return [];
            }
        };

        const fileTree = getFileTree(projectRoot);

        const contextString = `
[SHELL_CONTEXT]
System: ${systemInfo.os}
Node: ${systemInfo.nodeVersion}

File Structure:
${fileTree.join('\n')}
[/SHELL_CONTEXT]
`.trim();

        return NextResponse.json({
            success: true,
            context: contextString,
            metadata: systemInfo
        });
    } catch (error) {
        console.error('[ShellContext] Error:', error instanceof Error ? error.message : error);
        return NextResponse.json({
            success: false,
            error: 'Failed to gather shell context'
        }, { status: 500 });
    }
}
