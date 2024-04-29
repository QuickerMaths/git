import path from "path";
import fs from 'fs/promises';

export async function gitStatus(gitRoot: string) {
    const pathToHead = path.join(gitRoot, '.git/HEAD');
    const pathToIndex = path.join(gitRoot, '.git/index');
    const headFile = await fs.readFile(pathToHead, 'utf-8');
    const currentBranch = path.basename(headFile);
    let indexFile: Buffer;

    try {
        await fs.access(pathToIndex);
        indexFile = await fs.readFile(pathToIndex);
    } catch { 
        return `On branch ${currentBranch}\r\nno changes commited yet`; 
    }
}
