import fs from 'fs';
import { createTwoFilesPatch } from 'diff';
import { setStatus } from './status';
import { parseIndex } from '../utils/parseIndex';
import path from 'path';
import { FileMode, FileStatusCode } from '../enums/enums';
import { parseObject } from '../utils/parseObject';
import { hashObject } from './hash-object';

interface IFile {
    name: string;
    content: string;
    hash: string;
}

function getDiff(file1: IFile, file2: IFile, status: FileStatusCode, mode: FileMode) {
    let str = `diff ---git a/${file1.name} b/${file2.name}\n`; 

    if(status === FileStatusCode.DELETED) {
        str += `deleted file mode ${mode}\n`;
        str += `index ${file1.hash.substring(0,7)}..${file2.hash.substring(0,7)}\n`;
    } else {
        str += `index ${file1.hash.substring(0,7)}..${file2.hash.substring(0,7)} ${mode}\n`;
    }

    const diff = createTwoFilesPatch(`a/${file1.name}`, `b/${file2.name}`, file1.content, file2.content);

    const split = diff.split(/\r\n|\n/).slice(1);

    return str + split.join('\n')
}

export function diff(gitRoot: string) {
    const pathToIndex = path.resolve(gitRoot, '.git/index'); 
    const index = parseIndex(pathToIndex); 
    const statusFiles = setStatus(gitRoot, [], true);

    let str = '';

        statusFiles.forEach(file => {
            switch (file.workTree) {
                case FileStatusCode.ADDED:
                    case FileStatusCode.UNTRACKED:
                    case FileStatusCode.UNMODIFIED:
                    break;
                case FileStatusCode.DELETED: {
                    const entry = index.getEntry(file.name);
                    const object = parseObject(gitRoot, entry?.sha!);

                    const file1: IFile = {
                        name: file.name,
                        content: object.content.toString(),
                        hash: entry?.sha!
                    }

                    const file2: IFile = {
                        name: '/dev/null',
                        content: '',
                        hash: ''.padStart(20, '0')
                    }
                        
                    str += getDiff(file1, file2, file.workTree, entry?.modeType!);
                    break;
                }
                case FileStatusCode.MODIFIED: {
                    const entry = index.getEntry(file.name);
                    const object = parseObject(gitRoot, entry?.sha!);

                    const file1: IFile = {
                        name: file.name,
                        content: object.content.toString(),
                        hash: entry?.sha!
                    }

                    const hash = hashObject(gitRoot, [file.name], 'blob', false, false) 
                    const file2: IFile = {
                        name: file.name,
                        content: fs.readFileSync(file.name, 'utf-8'),
                        hash: hash[0] 
                    }
                        
                    str += getDiff(file1, file2, file.workTree, entry?.modeType!);
                    break;
                }
            }
        });

    return str;
}
