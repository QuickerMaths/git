import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { exists } from '../utils/exists';

function parseHeader(header: Buffer) {
    let i = 0;
    while(i < header.length && header[i] !== Buffer.from(' ')[0]) {
        i++
    }

    return {
        type: header.subarray(0, i),
        // remove space
        size: header.subarray(i + 1, header.length)
    }
}

function parseObject(fileContent: Buffer) {
    let i = 0;
    while (i < fileContent.length && fileContent[i] !== Buffer.from('\0')[0]) {
        i++
    }
    const header = fileContent.subarray(0, i);
    const content = fileContent.subarray(i, fileContent.length);

    const { type, size } = parseHeader(header);

    return {
        type,
        size,
        content
    }
}

export async function catFile(gitRoot: string, argvType: string, argvObject: string, returnType: boolean, returnSize: boolean, prettyPrint: boolean) {
    const objectDir = argvObject.slice(0, 2);
    const pathToObjectDir = path.resolve(gitRoot, '.git/objects', objectDir);
    const objectName = argvObject.substring(2, argvObject.length);
    const pathToObject = path.join(pathToObjectDir, objectName);

    if(!await exists(pathToObject)) throw Error(`fatal: Invalid object ${argvObject}`)

    const fileContent = await fs.readFile(pathToObject);
    const inflatedContent = zlib.inflateSync(fileContent);

    const { type, size, content } = parseObject(inflatedContent);

    // only one argument can be specified at a time
    let argvCount = [argvType, returnType, returnSize, prettyPrint].filter(Boolean).length;
    if (argvCount !== 1) throw Error('fatal: Invalid usage, only one argument can be specified at a time');
    if(!argvType && !returnType && !returnSize && !prettyPrint) throw Error('fatal: Invalid usage, provide one of [type] | -p | -s | -t');
    if(!!argvType.length && argvType !== type.toString()) throw Error(`fatal: Invalid type ${argvType}`);


    if(!!argvType.length && argvType === type.toString()) return content;
    if(prettyPrint) return content;
    if(returnSize) return size;
    if(returnType) return type;
}
