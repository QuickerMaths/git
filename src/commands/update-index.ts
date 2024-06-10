import path from 'path';
import fs from 'fs';
import { GitIndex } from '../objects/git-index';
import { IGitEntry } from '../types/types';
import { createIndexEntry } from '../utils/createIndexEntry';
import { parseIndex } from '../utils/parseIndex';

export function updateIndex(gitRoot: string, files: string [], add: boolean) {
    const entries: IGitEntry[] = [];
    const pathToIndex = path.resolve(gitRoot, '.git/index');

    const sortedFiles = files.sort();

    for(const file of sortedFiles) {
        if(fs.existsSync(path.relative(process.cwd(), file))) {
            const entry = createIndexEntry(file, gitRoot);
            entries.push(entry);
        } else {
            throw Error(`fatal: Cannot open '${file}': No such file or directory.`);
        }
    }
    
    let index: GitIndex;

    if(fs.existsSync(pathToIndex)) {
        index = parseIndex(pathToIndex);
        index.add(entries);
    } else {
        index = new GitIndex({ signature: 'DIRC', version: 2 }, entries)
    }

    if(add && !!files.length) index.write(gitRoot); 
}
