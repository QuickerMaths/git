import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'node:path';
import { GitObjects, GitObjectsType } from './types';

function isType(type: string): type is GitObjectsType  {
    return GitObjects.includes(type)
}

export async function hashObject(file: string, type: string) {
    if(!isType(type)) throw Error(`fatal: invalid object '${type}'`)

    const filePath = path.join(process.cwd(), file);

    try {
        await fs.access(filePath)
        return filePath + type
    } catch(error: any) {
        if(error.code === "ENOENT"){
            throw Error(`fatal: Cannot open '${file}': No such file or directory`)
        } else {
            throw Error(error)
        }
    }
}

