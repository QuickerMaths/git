import fs from 'fs/promises';
import { GitIndex } from '../objects/git-index';
import { IGitEntry } from '../types/types';
import { createIndexEntry } from '../utils/createIndexEntry';

export async function updateIndex(gitRoot: string, files: string [], add: boolean) {
    const entries: IGitEntry[] = [];

    for(const file of files) {
        try {
            await fs.access(file);
            const entry = await createIndexEntry(file, gitRoot);
            entries.push(entry);
        } catch {
            throw Error(`fatal: Cannot open '${file}': No such file or directory.`);
        }
    }

    const index = new GitIndex({ signature: 'DIRC', version: 2 }, entries);

    if(add && !!files.length) await index.write();
}
