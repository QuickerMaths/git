import { FileMode, UnixPermissions, Stage } from "../enums/enums";

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
    modePerms: UnixPermissions;
    uid: number;
    gid: number; 
    fileSize: number;
    sha: string;
    name: string; 
    stage: Stage;
    assumeValid: boolean;
    extended: number;
    indentToAdd: boolean; 
    skipWorkTree: boolean;
}

export interface IGitIndex { 
    header: IGitHeader;
    entries: IGitEntry[];
}

