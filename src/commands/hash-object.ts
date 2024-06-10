import fs from 'fs';
import path from 'node:path';
import { GitObjectsType, GitObjects } from '../types/types';
import { hashContent } from '../utils/hashContents';
import { getStdin } from '../utils/getStdin';

function isType(type: string): type is GitObjectsType  {
    return GitObjects.includes(type);
}

export function hashObject(gitRoot: string, files: string[], type: string, write: boolean, stdin: boolean) {
    if(!isType(type)) throw Error(`fatal: invalid object '${type}'`);
    if(type !== 'blob') throw Error(`fatal: ${type} is not supported, try blob`);
    
    //TOOD: even if some invalid files are provided it should process other valid files

    const filePaths = [];

    for(const file of files) {
        if(fs.existsSync(file)) {
            const filePath = path.resolve(gitRoot, file);
            filePaths.push(filePath);
        } else {
            throw Error(`fatal: Cannot open '${file}': No such file or directory.`);
        }
    }

    const hashes: string[] = [];

    //TODO: implement sync way to get stdin
    // if(stdin) {
    //  const content = await getStdin()
    //  const hash = hashContent(gitRoot, type, write, content);
    // hashes.push(hash);
    // }

    filePaths.map(filePath => {
        const content = fs.readFileSync(filePath);
        const hash = hashContent(gitRoot, type, write, content);
        hashes.push(hash);
    });

    return hashes;
}

