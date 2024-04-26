import fs from 'fs/promises';
import path from 'node:path';
import { GitObjectsType, GitObjects } from '../types/types';
import { hashContents } from '../utils/hashContents';

function isType(type: string): type is GitObjectsType  {
    return GitObjects.includes(type);
}

export async function hashObject(gitRoot: string, files: string[], type: string, write: boolean, stdin: boolean) {
    if(!isType(type)) throw Error(`fatal: invalid object '${type}'`);
    if(type !== 'blob') throw Error(`fatal: ${type} is not supported, try blob`);
    
    const filePaths = [];

    for(const file of files) {
        try {
            await fs.access(file);
            const filePath = path.resolve(gitRoot, file);
            filePaths.push(filePath);
        } catch {
            throw Error(`fatal: Cannot open '${file}': No such file or directory.`);
        }
    }

    return await hashContents(gitRoot, type, write, filePaths, stdin);
}

