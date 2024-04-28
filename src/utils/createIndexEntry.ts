import * as fsPromises from 'fs/promises';
import path from 'path';
import { FileMode, Stage } from '../enums/enums';
import { hashContent } from './hashContents';
import { IGitEntry } from '../types/types';

export async function createIndexEntry(file: string, gitRoot: string): Promise<IGitEntry> { 
    const relativeFilePath = path.relative(gitRoot, file);
    const stat = await fsPromises.lstat(relativeFilePath);

    const ctimeSec = Math.floor(stat.ctimeMs / 1000);
    const ctimeNano = Math.floor((stat.ctimeMs - ctimeSec * 1000) * 1000000);
    const mtimeSec = Math.floor(stat.mtimeMs / 1000);
    const mtimeNano = Math.floor((stat.mtimeMs - mtimeSec * 1000) * 1000000);

    const content = await fsPromises.readFile(file);
    const sha = await hashContent(gitRoot, 'blob', true, content);

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
        name: file, 
        stage: Stage.ZERO,
        assumeValid: 1,
        extended: 0,
        indentToAdd: false,
        skipWorkTree: false
    }
}
