import path from "path";
import fs from 'fs';

export function getCurrentBranch(gitRoot: string) {
    const pathToHead = path.join(gitRoot, '.git/HEAD');
    const headFile = fs.readFileSync(pathToHead, 'utf-8');
    const currentBranch = path.basename(headFile);
    
    return currentBranch;
}
