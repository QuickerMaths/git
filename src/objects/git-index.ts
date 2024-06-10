import { IGitIndex, IGitHeader, IGitEntry } from "../types/types";
import fs from 'fs';
import { encodeEntry } from "../utils/encodeEntry";
import { createHash } from "crypto";
import path from "path";

export class GitIndex implements IGitIndex {
    header;
    entries;

    constructor(header: IGitHeader, entries: IGitEntry[] = []) {
        this.header = header;
        this.entries = entries;
    }

    add(entries: IGitEntry[]) {
        const entriesMap = new Map(this.entries.map(entry => [entry.name, entry]));
        entries.forEach(entry => {
            entriesMap.set(entry.name, entry);
        });
        this.entries = Array.from(entriesMap.values());
    }

    remove(name: string) {
        this.entries = this.entries.filter(entry => entry.name !== name);
    }

    getEntry(name: string) {
        return this.entries.find(entry => entry.name === name);
    }

    write(gitRoot: string) {
        const header = Buffer.alloc(12);
        header.set(Buffer.from(this.header.signature), 0);
        header.writeInt32BE(this.header.version, 4);
        header.writeInt32BE(this.entries.length, 8); 
        
        const encodedEntries: Buffer[] = []; 
        const sortedEntries = this.entries.sort((a, b) => a.name.localeCompare(b.name)); 

        sortedEntries.forEach(entry => {
            encodedEntries.push(encodeEntry(entry));
        });

        const indexContent = Buffer.concat([header, ...encodedEntries])

        const checksum = Buffer.from(
            createHash('sha1').update(indexContent).digest('hex'),
            'hex'
        );

        fs.writeFileSync(path.join(gitRoot, '.git/index'), Buffer.concat([indexContent, checksum]), 'hex');
    }
}
