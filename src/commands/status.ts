import path from "path";
import fs from 'fs/promises';
import { exists } from '../utils/exists';
import { GitIndex } from '../objects/git-index'; 
import { parseIndex } from '../utils/parseIndex';
import { FileStatusCode } from "../enums/enums";
import { Stats } from "fs";
import { hashObject } from "./hash-object";

async function processUntrackedFile(file: string, workingTreeFilesStats: Map<string, Stats>) {
    try {
        const directoryFiles = await fs.readdir(file, { recursive: true });
        await Promise.all(directoryFiles.map(async directoryFile => {
            workingTreeFilesStats.set(directoryFile, await fs.lstat(directoryFile));
        }));
    } catch(err: any) {
        if(err.code === 'ENOTDIR') {
            workingTreeFilesStats.set(file, await fs.lstat(file));
            return;
        }
        throw Error(err);
    }
}

async function readWorkingTree(gitRoot: string, files: string[], untrackedFiles: boolean, workingTreeFilesStats: Map<string, Stats>) {
    let startFormGitRoot = true;
    // if files are provided but one of them is '.' that refers to git root, we skip other files and read from git root 
    if(!!files.length) {
        const dotPath = files.find(file => file === '.');
        if(!dotPath || path.resolve(dotPath) !== gitRoot) startFormGitRoot = false;
    }
    
    if(startFormGitRoot) {
        const rootDir = await fs.opendir(gitRoot);

        for await (const file of rootDir) {
            if(file.name === '.DS_Store' || file.name === '.git') continue;

            const filePath = path.relative(gitRoot, file.name);

            if(untrackedFiles) {
               processUntrackedFile(filePath, workingTreeFilesStats);
            } else {
                workingTreeFilesStats.set(filePath, await fs.lstat(filePath));
            }
        }

        return workingTreeFilesStats; 
    }

    await Promise.all(files.map(async file => {
        if(await exists(file)){
            if(untrackedFiles) {
                await processUntrackedFile(file, workingTreeFilesStats);
            } else {
                workingTreeFilesStats.set(file, await fs.lstat(file));
            }
        }
    }));

    return workingTreeFilesStats;
}

async function workTreeIndexDiff(gitRoot:string, workingTreeFilesStats: Map<string, Stats>, index: GitIndex, statusFiles: Map<string, FileStatusCode>) {
    await Promise.all(index.entries.map(async entry => {
       if(workingTreeFilesStats.has(entry.name)) {
           const workingTreeFileHash = await hashObject(gitRoot, [entry.name], 'blob', false, false)
            if(workingTreeFileHash[0] === entry.sha) {
                statusFiles.set(entry.name, FileStatusCode.UNMODIFIED);
            } else {
                statusFiles.set(entry.name, FileStatusCode.MODIFIED);
            }
       } else {
           statusFiles.set(entry.name, FileStatusCode.DELETED);
       }

       workingTreeFilesStats.delete(entry.name);
    }));

    workingTreeFilesStats.forEach((_value, key) => statusFiles.set(key, FileStatusCode.UNTRACKED));
}

function sendOutput(currentBranch: string, statusFiles: Map<string, FileStatusCode>) {
    console.log(statusFiles);
    return `On branch ${currentBranch}`;
}

export async function gitStatus(gitRoot: string, paths: string[], untrackedFiles: boolean) {
    let index: GitIndex;
    const workingTreeFilesStats = new Map<string, Stats>;
    const statusFiles = new Map<string, FileStatusCode>;

    const pathToHead = path.join(gitRoot, '.git/HEAD');
    const pathToIndex = path.join(gitRoot, '.git/index');
    const headFile = await fs.readFile(pathToHead, 'utf-8');
    const currentBranch = path.basename(headFile);

    await readWorkingTree(gitRoot, paths, untrackedFiles, workingTreeFilesStats);

    try {
        await fs.access(pathToIndex);
        index = await parseIndex(pathToIndex);
        await workTreeIndexDiff(gitRoot, workingTreeFilesStats, index, statusFiles);
        return sendOutput(currentBranch, statusFiles);
    } catch { 
        workingTreeFilesStats.forEach((_value, key) => statusFiles.set(key, FileStatusCode.UNTRACKED));
        return sendOutput(currentBranch, statusFiles);
    }
}
