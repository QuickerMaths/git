import { FileMode, Stage } from "../enums/enums";
import { TreeObject } from "../objects/tree";

export const GitObjects = ['blob', 'tree', 'commit', 'tag'];

export type GitObjectsType = typeof GitObjects[number];

export interface IGitHeader {
    signature: string;
    version: number;
}

export interface IGitEntry {
    ctimeSec: number; 
    ctimeNano: number; 
    mtimeSec: number; 
    mtimeNano: number; 
    dev: number;
    ino: number;
    modeType: FileMode;
    uid: number;
    gid: number; 
    fileSize: number;
    sha: string;
    name: string; 
    stage: Stage;
    assumeValid: number;
    indentToAdd: boolean; 
    skipWorkTree: boolean;
}

export interface IGitIndex { 
    header: IGitHeader;
    entries: IGitEntry[];
}

export interface IGitTreeObject { 
    mode: FileMode; 
    path: string;
    name: string;
    hash?: string;
    children: Map<string, IGitTreeObject>;
}

export interface IGitTree {
    treeRoot: TreeObject;
    treeObjects: Map<string, IGitTreeObject>;
}

export interface GitCommit {
    hash: string;
    author: string;
    committer: string;
    message: string;
    parents: string[];
}
