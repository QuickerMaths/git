import path from "path";
import fs from 'fs';
import zlib from 'zlib';

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

export function parseObject(gitRoot: string, argvObject: string) {
    const objectDir = argvObject.slice(0, 2);;
    const pathToObjectDir = path.resolve(gitRoot, '.git/objects', objectDir);
    const objectName = argvObject.substring(2, argvObject.length);
    const file = fs.readdirSync(pathToObjectDir).filter(file => file.startsWith(objectName))

    if(!file.length) throw Error(`fatal: Invalid object ${argvObject}`)
    const pathToObject = path.join(pathToObjectDir, file[0]);
    const fileContent = fs.readFileSync(pathToObject);
    const inflatedContent = zlib.inflateSync(fileContent);

    let i = 0;
    while (i < inflatedContent.length && inflatedContent[i] !== Buffer.from('\0')[0]) {
        i++
    }
    const header = inflatedContent.subarray(0, i);
    const content = inflatedContent.subarray(i, inflatedContent.length);

    const { type, size } = parseHeader(header);

    return {
        type,
        size,
        content
    }
}

