import fs from 'fs';
import path from 'path';
import { FileMode, Stage } from '../enums/enums';
import { hashContent } from './hashContents';
import { IGitEntry } from '../types/types';

export function createIndexEntry(file: string, gitRoot: string): IGitEntry { 
    const relativeFilePath = path.relative(process.cwd(), file);
    const stat = fs.lstatSync(relativeFilePath);

    const ctimeSec = Math.floor(stat.ctimeMs / 1000);
    const ctimeNano = Math.floor((stat.ctimeMs - ctimeSec * 1000) * 1000000);
    const mtimeSec = Math.floor(stat.mtimeMs / 1000);
    const mtimeNano = Math.floor((stat.mtimeMs - mtimeSec * 1000) * 1000000);

    const content = fs.readFileSync(file);
    const sha = hashContent(gitRoot, 'blob', true, content);

    return {
        ctimeSec,
        ctimeNano,
        mtimeSec,
        mtimeNano,
        dev: stat.dev,
        ino: stat.ino,
        modeType: FileMode.REGULAR,
        uid: stat.uid,
        gid: stat.gid, 
        fileSize: stat.size,
        sha: sha, 
        name: path.relative(gitRoot, relativeFilePath), 
        stage: Stage.ZERO,
        assumeValid: 0,
        indentToAdd: false,
        skipWorkTree: false
    }
}
