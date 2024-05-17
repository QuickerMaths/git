import fs from 'fs/promises';
import path from 'node:path';
import { GitObjectsType, GitObjects } from '../types/types';
import { hashContent } from '../utils/hashContents';
import { getStdin } from '../utils/getStdin';

function isType(type: string): type is GitObjectsType  {
    return GitObjects.includes(type);
}

export async function hashObject(gitRoot: string, files: string[], type: string, write: boolean, stdin: boolean) {
    if(!isType(type)) throw Error(`fatal: invalid object '${type}'`);
    if(type !== 'blob') throw Error(`fatal: ${type} is not supported, try blob`);
    
    //TOOD: even if some invalid files are provided it should process other valid files

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

    const hashes: string[] = [];

    if(stdin) {
        const content = await getStdin()
        const hash = await hashContent(gitRoot, type, write, content);
        hashes.push(hash);
    }

    await Promise.all(filePaths.map(async filePath => {
        const content = await fs.readFile(filePath);
        const hash = await hashContent(gitRoot, type, write, content);
        hashes.push(hash);
    }));

    return hashes;
}

