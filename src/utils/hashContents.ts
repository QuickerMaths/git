import { createHash } from "crypto";
import path from "path";
import fs from 'fs';
import zlib from 'zlib';

export function hashContent(gitRoot:string, type: string, write: boolean, content: Buffer) {
    const bufferToHash = Buffer.from(`${type} ${content.byteLength}\0${content}`)

    const hash = createHash('sha1').update(bufferToHash).digest('hex');

    if(write) {
        const blobDirName = hash.substring(0, 2);
        const blobName = hash.substring(2, hash.length)
        const compressedContent = zlib.deflateSync(bufferToHash);
        const pathToBlobDir = path.resolve(gitRoot, '.git', 'objects', blobDirName);
        const pathToBlobFile = path.join(pathToBlobDir, blobName); 

        fs.mkdirSync(pathToBlobDir, { recursive: true });
        fs.writeFileSync(pathToBlobFile, compressedContent);
    }

    return hash;
}

