import fs from 'fs';
import { GitIndex } from '../objects/git-index';
import { IGitEntry } from '../types/types';
import { CTIME_OFFSET, CTIME_NANO_OFFSET, MTIME_OFFSET, MTIME_NANO_OFFSET, DEV_OFFSET, INO_OFFSET, MODE_OFFSET, UID_OFFSET, GID_OFFSET, FILES_SIZE_OFFSET, FLAGS_OFFSET, NAME_OFFSET, SHA_OFFSET } from '../constants/constants';

function parsedEntry(content: Buffer, entryPosition: number) {
    const parsedEntry = {} as IGitEntry;

    parsedEntry.ctimeSec = content.readInt32BE(entryPosition + CTIME_OFFSET);
    parsedEntry.ctimeNano = content.readInt32BE(entryPosition + CTIME_NANO_OFFSET);

    parsedEntry.mtimeSec = content.readInt32BE(entryPosition + MTIME_OFFSET);
    parsedEntry.mtimeNano = content.readInt32BE(entryPosition + MTIME_NANO_OFFSET);

    parsedEntry.dev = content.readInt32BE(entryPosition + DEV_OFFSET);

    parsedEntry.ino = content.readInt32BE(entryPosition + INO_OFFSET);

    parsedEntry.modeType = content.readInt32BE(entryPosition + MODE_OFFSET);

    parsedEntry.uid = content.readInt32BE(entryPosition + UID_OFFSET);

    parsedEntry.gid = content.readInt32BE(entryPosition + GID_OFFSET);

    parsedEntry.fileSize = content.readInt32BE(entryPosition + FILES_SIZE_OFFSET);

    parsedEntry.sha = content
    .subarray(entryPosition + SHA_OFFSET, entryPosition + SHA_OFFSET + 20)
    .toString('hex');

    const flags = content.readInt16BE(entryPosition + FLAGS_OFFSET);
    parsedEntry.stage = (flags & (0b11 << 12)) >> 12;
    
    parsedEntry.assumeValid = (flags & (0b11 << 12)) >> 12; 

    const nameLength = 0xfff & flags;
    parsedEntry.name = content
    .subarray(entryPosition + NAME_OFFSET, entryPosition + NAME_OFFSET + nameLength)
    .toString('utf8');


    return { nameLength, parsedEntry };
} 

export function parseIndex(pathToIndex: string) { 
    const indexFile = fs.readFileSync(pathToIndex);
    let entryPosition = 0;

    const signature = indexFile.subarray(0, 4).toString();
    if(signature !== 'DIRC') throw Error('fatal: Invalid index signature'); 

    const version = indexFile.readInt32BE(4);
    if(version !== 2) throw Error('fatal: Invalid index version: ccgit only supports version 2');

    const entriesCount = indexFile.readInt32BE(8);
    const entries = new Array<IGitEntry>(entriesCount);
    const content = indexFile.subarray(12);

    for(let i = 0; i < entriesCount; i++) {
        const { nameLength, parsedEntry: entry } = parsedEntry(content, entryPosition);        
        entryPosition += NAME_OFFSET + nameLength;

        while (content[entryPosition] === Buffer.from('\0')[0] && entryPosition < content.length) {
            entryPosition++;
        }

        entries[i] = entry;
    }

    return new GitIndex({ signature, version }, entries);
}
