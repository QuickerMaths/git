import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'node:path';
import zlib from 'zlib';
import { GitObjectsType, GitObjects } from './types/types';

function isType(type: string): type is GitObjectsType  {
    return GitObjects.includes(type);
}

async function processInput(filePaths: string[], stdin: boolean) { 
    const contents: Buffer[] = [];

    if(stdin) {
        const stdinContents: Buffer = await new Promise(function(resolve, _reject) {
            process.stdin.on("data", function(data) {
                resolve(data);
            });
        });
        contents.push(stdinContents);
    } 
    
    // if not provided defaults to  empty array
    if(filePaths.length){
        const filesContents = await Promise.all(filePaths.map(async (filePath) => await fs.readFile(filePath)));
        contents.push(...filesContents);
    }

    return contents;
}

async function hashContents(gitRoot:string, type: string, write: boolean, contents: Buffer[]) {
    return Promise.all(contents.map(async (content) => {
        const bufferToHash = Buffer.from(`${type} ${content.byteLength}\0${content}`)

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
    }));
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

    const contents = await processInput(filePaths, stdin);
    return await hashContents(gitRoot, type, write, contents);
}

