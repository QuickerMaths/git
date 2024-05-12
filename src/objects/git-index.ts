import { IGitIndex, IGitHeader, IGitEntry } from "../types/types";
import fs from 'fs/promises';
import { encodeEntry } from "../utils/encodeEntry";
import { createHash } from "crypto";

export class GitIndex implements IGitIndex {
    header;
    entries;

    constructor(header: IGitHeader, entries: IGitEntry[] = []) {
        this.header = header;
        this.entries = entries;
    }

    add(entries: IGitEntry[]) {
        entries.forEach(entry => this.entries.push(entry));
    }

    remove(entry: IGitEntry) {
        this.entries.filter(e => e !== entry);
    }

    async write() {
        const header = Buffer.alloc(12);
        header.set(Buffer.from(this.header.signature), 0);
        header.writeInt32BE(this.header.version, 4);
        header.writeInt32BE(this.entries.length, 8); 
        
        const encodedEntries: Buffer[] = []; 
        this.entries.forEach(entry => {
            encodedEntries.push(encodeEntry(entry));
        });

        const indexContent = Buffer.concat([header, ...encodedEntries])

        const checksum = Buffer.from(
            createHash('sha1').update(indexContent).digest('hex'),
            'hex'
        );

        await fs.writeFile('.git/index', Buffer.concat([indexContent, checksum]), 'hex');
    }
}
