import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { EntryType, FileMode } from '../enums/enums';
import { IGitTreeObject, IGitTree, IGitEntry } from '../types/types';
import { createHash } from 'crypto';

export class Tree implements IGitTree {
    treeRoot;
    treeObjects;

    constructor() {
        this.treeRoot = new TreeObject(FileMode.DIR, '', '');
        this.treeObjects = new Map<string, IGitTreeObject>;
    }

    createTree(entries: IGitEntry[]) {
        const treeObjects = entries.map(entry => {
            const name = path.basename(entry.name);
            return new TreeObject(FileMode.REGULAR, entry.name, name, entry.sha);
        })

        treeObjects.forEach(object => {
            let tempRoot = this.treeRoot;
            let currentPath = '';
            const paths = object.path.split('/');
            
            for(let i = 0; i < paths.length; i++) {
                currentPath = path.join(currentPath, paths[i]);

                // last path is a file path
                if(i === paths.length - 1) {
                   const treeObject = new TreeObject(FileMode.REGULAR, currentPath, paths[i], object.hash); 
                   tempRoot.children.set(paths[i], treeObject);
                   // set file object, to then be able to retirive it easly
                   this.treeObjects.set(paths[i], object);
                   return;
                }

                if(!this.treeObjects.get(currentPath)) {
                    const treeObject = new TreeObject(FileMode.DIR, currentPath, paths[i]);
                    tempRoot.children.set(paths[i], treeObject);
                }

                tempRoot = tempRoot.children.get(paths[i])!;
            }
            
            if (object.path === this.treeRoot.path) {
                this.treeRoot = object;
            }
        });
    }

    getTreeObject(pathToFile: string) {
        return this.treeObjects.get(pathToFile);
    }
}

export class TreeObject implements IGitTreeObject {
    mode;
    path;
    name;
    hash;
    children;

    constructor(mode: FileMode, path: string, name: string, hash?: string) {
        this.mode = mode;
        this.path = path;
        this.name = name;
        this.hash = hash;
        this.children = new Map<string, TreeObject>;

        if (mode === FileMode.REGULAR && hash === undefined) {
            throw Error(`No hash provided with file ${path}`);
        }
    }

    hashTree(gitRoot: string, write: boolean = false) {
        if(this.mode === FileMode.REGULAR) return this.hash;
        const buffers: Buffer[] = [];

        this.children.forEach(child => {
            const hash = child.hashTree(gitRoot, write);
            buffers.push(
                Buffer.concat([
                    Buffer.from(`${child.mode.toString(8)} ${child.name}\0`),
                    Buffer.from(hash as string, 'hex')
                ])
            );
        });

        const content = Buffer.concat(buffers);
        // it does not begin executed for files
        const header = Buffer.from(
            `tree ${content.byteLength}\0`
        );
        const store = Buffer.concat([header, content]);

        const hash = createHash('sha1').update(store).digest('hex');

        if (write) {
            const zlibContent = zlib.deflateSync(store);
            const pathToBlob = path.join(
                gitRoot,
                '.git/objects',
                hash.substring(0, 2),
                hash.substring(2, hash.length)
            );
            fs.mkdirSync(path.dirname(pathToBlob), { recursive: true });
            fs.writeFileSync(pathToBlob, zlibContent, { encoding: 'hex' });
        }
        
        return hash;
    }

    encodeTree(content: Buffer) {
    }
}
