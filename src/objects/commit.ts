import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import ini from 'ini';
import { parseObject } from '../utils/parseObject';
import { createHash } from 'crypto';
import { GitCommit } from '../types/types';
import { getStdin } from '../utils/getStdin';

export class Commit implements GitCommit {
    hash;
    author;
    committer;
    message;
    parents: string[];

    constructor(parents?: string[]) {
        this.hash = '';
        this.author = '';
        this.committer = '';
        this.message = '';
        this.parents = parents || [];
    }

    async createCommit(gitRoot: string, treeHash: string, message?: string, parent?: string) {
        const { type } = await parseObject(gitRoot, treeHash); 
        if(type.toString() !== 'tree') throw Error(`fatal: Invalid Object type ${type}`);

        if(parent) this.setParents(gitRoot, parent);
        this.signCommit();
        await this.writeMessage(message);

        let content = `tree ${treeHash}\n`;

        this.parents.forEach((hash) => {
            content += `parent ${hash}\n`;
        });
        content += `author ${this.author.toString()}`;
        content += `\ncommitter ${this.committer.toString()}`;
        content += `\n\n${this.message}\n`;

        const contentBuffer = Buffer.from(content);
        const header = Buffer.from(`commit ${contentBuffer.byteLength}\0`);

        const store = Buffer.concat([header, contentBuffer]);
        const hash = createHash('sha1').update(store).digest('hex');

        const zlibContent = zlib.deflateSync(store);
        const pathToBlob = path.join(
            gitRoot,
            '.git/objects',
            hash.substring(0, 2),
            hash.substring(2, hash.length)
        );
        fs.mkdirSync(path.dirname(pathToBlob), { recursive: true });
        fs.writeFileSync(pathToBlob, zlibContent);
        
        this.hash = hash;
        return hash;
    }

    private async setParents(gitRoot: string, parent: string) {
        const { type } = await parseObject(gitRoot, parent); 
        if(type.toString() !== 'tree') throw Error(`fatal: Invalid Object type ${type}`);

        this.parents.push(parent);
    }

    private async writeMessage(message?: string) {
        if(message) return this.message = message; 

        process.stdout.write('Please specify commit message:\n');
        const stdinMessage = await getStdin();
        this.message = stdinMessage.toString();
    }

    private signCommit() {
        const { name, email } = getCredentials();
        const date = getTimestampAndZoneOffset();
        const sign = `${name} <${email}> ${date}`;

        this.author = sign;
        this.committer = sign;
    }
}

function getCredentials() {
    const pathToConfig = path.join(
        (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) ?? '',
        '.gitconfig'
    );
    const configFile = ini.parse(fs.readFileSync(pathToConfig).toString());    

    return {
        name: configFile.user.name,
        email: configFile.user.email
    }
}

function getTimestampAndZoneOffset() {
    const date = new Date()
    const seconds = Math.floor(date.getTime() / 1000);
    const timezoneOffsetInMin = date.getTimezoneOffset();
    const sign = timezoneOffsetInMin < 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(timezoneOffsetInMin) / 60);
    const minutes = Math.abs(timezoneOffsetInMin) - 60 * hours;
    return `${seconds} ${sign}${hours.toString().padStart(2, '0')}${minutes
        .toString()
        .padStart(2, '0')}`;
}
