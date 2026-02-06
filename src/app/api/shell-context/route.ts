import { NextResponse } from 'next/server';
import os from 'os';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const projectRoot = process.cwd();

        // Basic system info
        const systemInfo = {
            os: `${os.type()} ${os.release()} (${os.arch()})`,
            nodeVersion: process.version,
            platform: process.platform,
            cpuModel: os.cpus()[0]?.model || 'Unknown',
            totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
            freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
        };

        // File tree (top-level and src/)
        const getFileTree = (dir: string, depth = 0): string[] => {
            if (depth > 2) return [];
            try {
                const files = fs.readdirSync(dir);
                let result: string[] = [];
                for (const file of files) {
                    if (file === 'node_modules' || file === '.git' || file === '.next') continue;
                    const fullPath = path.join(dir, file);
                    const isDirectory = fs.statSync(fullPath).isDirectory();
                    result.push(`${'  '.repeat(depth)}${isDirectory ? '📁' : '📄'} ${file}`);
                    if (isDirectory && depth < 1) {
                        result = [...result, ...getFileTree(fullPath, depth + 1)];
                    }
                }
                return result;
            } catch (e) {
                return [];
            }
        };

        const fileTree = getFileTree(projectRoot);

        const contextString = `
[SHELL_CONTEXT]
System: ${systemInfo.os}
Node: ${systemInfo.nodeVersion}
Memory: ${systemInfo.freeMemory} / ${systemInfo.totalMemory}
Project Path: ${projectRoot}

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
        console.error('Failed to get shell context:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to gather shell context'
        }, { status: 500 });
    }
}
