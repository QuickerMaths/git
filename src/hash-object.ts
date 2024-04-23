import fs from 'fs/promises';
import path from 'node:path';
import { GitObjects, GitObjectsType } from './types';
import { createHash } from 'crypto';
import zlib from 'zlib';

function isType(type: string): type is GitObjectsType  {
    return GitObjects.includes(type);
}

async function hashFile(gitRoot:string, filePath: string, type: string, write: boolean) {
    const contents = await fs.readFile(filePath);

    const bufferToHash = Buffer.from(`${type} ${contents.byteLength}\0${contents}`)
    
    const hash = createHash('sha1').update(bufferToHash).digest('hex');

    if(write) {
        const blobDirName = hash.substring(0, 2);
        const blobName = hash.substring(2, hash.length)
        const compressedContent = zlib.deflateSync(bufferToHash);
        const pathToBlobDir = path.resolve(gitRoot, '.git', 'objects', blobDirName);
        const pathToBlobFile = path.join(pathToBlobDir, blobName); 

        await fs.mkdir(pathToBlobDir, { recursive: true });
        await fs.writeFile(pathToBlobFile, compressedContent);
    }

    return hash;
}

export async function hashObject(gitRoot: string, file: string, type: string, write: boolean) {
    if(!isType(type)) throw Error(`fatal: invalid object '${type}'`);
    if(type !== 'blob') throw Error(`fatal: ${type} is not supported, try blob`);

    const filePath = path.join(process.cwd(), file);

    try {
        await fs.access(filePath);
        const hash = await hashFile(gitRoot, filePath, type, write);
        return hash;
    } catch(error: any) {
        if(error.code === "ENOENT"){
            throw Error(`fatal: Cannot open '${file}': No such file or directory`);
        } else {
            throw error;
        }
    }
}

