import * as fsPromises from 'fs/promises';
import fs from 'fs';
import path from 'path'; 
import { FileMode, Stage, UnixPermissions } from '../enums/enums';
import { hashContent } from './hashContents';
import { IGitEntry } from '../types/types';

export async function createIndexEntry(file: string, gitRoot: string): Promise<IGitEntry> { 
    let stat: fs.Stats;
    const filePath = path.relative(gitRoot, file);
    
    try {
        await fsPromises.access(filePath);
        stat = await fsPromises.lstat(filePath);
    } catch {
        throw Error(`fatal: Cannot open '${file}': No such file or directory.`);
    }

    const ctimeSec = Math.floor(stat.ctimeMs / 1000);
    const ctimeNano = Math.floor((stat.ctimeMs - ctimeSec * 1000) * 1000_000);
    const mtimeSec = Math.floor(stat.mtimeMs / 1000);
    const mtimeNano = Math.floor((stat.mtimeMs - mtimeSec * 1000) * 1000_000);

    const content = await fsPromises.readFile(filePath);
    const sha = await hashContent(gitRoot, 'blob', true, content);

    return {
        ctimeSec,
        ctimeNano,
        mtimeSec,
        mtimeNano,
        dev: stat.dev,
        ino: stat.ino,
        modeType: FileMode.REGULAR,
        modePerms: UnixPermissions.ABSOLUTE,
        uid: stat.uid,
        gid: stat.gid, 
        fileSize: stat.size,
        sha: sha, 
        name: filePath, 
        stage: Stage.ZERO,
        assumeValid: true,
        extended: 0,
        indentToAdd: false,
        skipWorkTree: false
    }
}
