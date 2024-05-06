import path from "path";
import fs from 'fs/promises';
import * as fsSync from 'fs';
import { exists } from '../utils/exists';
import { GitIndex } from '../objects/git-index'; 
import { parseIndex } from '../utils/parseIndex';
import { FileStatusCode } from "../enums/enums";
import { Stats } from "fs";
import { hashObject } from "./hash-object";
import { FgRed, ColorReset, FgGreen } from "../constants/constants";
import { getCurrentBranch } from "../utils/getCurrentBranch";

function processUntrackedFile(gitRoot: string, argvPath: string, workingTreeFilesStats: Map<string, Stats>) {
    try {
        const directoryFiles =  fsSync.readdirSync(argvPath, { recursive: true });

        directoryFiles.forEach(directoryFile => {
            const relativeFilePath = path.relative(gitRoot, path.resolve(argvPath, directoryFile.toString()));

            workingTreeFilesStats.set(relativeFilePath, fsSync.lstatSync(relativeFilePath));
        });
    } catch(err: any) {
        if(err.code === 'ENOTDIR') {
            const relativeFilePath = path.relative(gitRoot, argvPath);
            workingTreeFilesStats.set(argvPath, fsSync.lstatSync(relativeFilePath));
            return;
        }
        throw Error(err);
    }
}

async function readWorkingTree(gitRoot: string, argvPaths: string[], untrackedFiles: boolean, workingTreeFilesStats: Map<string, Stats>) {
    let startFormGitRoot = true;
    // if files are provided but one of them is '.' that refers to git root, we skip other files and read from git root 
    if(!!argvPaths.length) {
        const dotPath = argvPaths.find(file => file === '.');
        if(!dotPath || path.resolve(dotPath) !== gitRoot) startFormGitRoot = false;
    }
    
    if(startFormGitRoot) {
        const rootDir = await fs.opendir(gitRoot);

        for await (const file of rootDir) {
            if(file.name === '.git') continue;

            const filePath = path.relative(gitRoot, file.name);

            if(untrackedFiles) {
                processUntrackedFile(gitRoot, filePath, workingTreeFilesStats);
            } else {
                workingTreeFilesStats.set(filePath, fsSync.lstatSync(filePath));
            }
        }
        return workingTreeFilesStats; 
    }

    await Promise.all(argvPaths.map(async argvPath => {
        if(await exists(argvPath)){
            if(untrackedFiles) {
                processUntrackedFile(gitRoot, argvPath, workingTreeFilesStats);
            } else {
                workingTreeFilesStats.set(argvPath, fsSync.lstatSync(argvPath));
            }
        }
    }));

    return workingTreeFilesStats;
}

async function workTreeIndexDiff(gitRoot:string, workingTreeFilesStats: Map<string, Stats>, index: GitIndex, statusFiles: Map<string, FileStatusCode>) {
    await Promise.all(index.entries.map(async entry => {
       if(workingTreeFilesStats.has(entry.name)) {
           const workingTreeFileHash = await hashObject(gitRoot, [entry.name], 'blob', false, false)
           const fileStatus = workingTreeFileHash[0] === entry.sha ? FileStatusCode.UNMODIFIED : FileStatusCode.MODIFIED;

           statusFiles.set(entry.name, fileStatus);
       } else {
           statusFiles.set(entry.name, FileStatusCode.DELETED);
       }

       workingTreeFilesStats.delete(entry.name);
    }));

    workingTreeFilesStats.forEach((_value, key) => statusFiles.set(key, FileStatusCode.UNTRACKED));
}

function sendOutput(currentBranch: string, statusFiles: Map<string, FileStatusCode>) {
    let output = `On branch ${currentBranch}`;
    let changesToBeCommited = ``;
    let changesNotStaged = ``;
    let untrackedFiles = ``;
    
    statusFiles.forEach((value, key) => {
        switch(value) {
            case FileStatusCode.UNMODIFIED: 
                changesToBeCommited += `\tnew file: ${key}\r\n`;
            break;
            case FileStatusCode.UNTRACKED: 
                untrackedFiles += `\t${key}\r\n`;
            break;
            case FileStatusCode.MODIFIED: 
                changesNotStaged += `\tmodified: ${key}\r\n`;
            break;
            case FileStatusCode.DELETED: 
                changesNotStaged += `\tdeleted: ${key}\r\n`;
            break;
            default: 
                throw Error(`fatal: Invalid worktree status: ${key}`);
        } 
    });

    if (changesToBeCommited.length > 0) {
        output += `\r\nChanges to be committed:\r\n\r\n${FgGreen}${changesToBeCommited}${ColorReset}`;
    }
    if (changesNotStaged.length > 0) {
        output += `\r\nChanges not staged for commit:\r\n\r\n${FgRed}${changesNotStaged}${ColorReset}`;
    }
    if (untrackedFiles.length > 0) {
        output += `\r\nUntracked files:\r\n\r\n${FgRed}${untrackedFiles}${ColorReset}`;
    }
    if (changesToBeCommited.length === 0) {
        if (untrackedFiles.length === 0 && changesNotStaged.length === 0) {
            output += '\r\nnothing to commit, working tree clean';
        } else {
            output += '\r\nno changes added to commit';
        }
    }

    return output;
}

export async function gitStatus(gitRoot: string, argvPaths: string[], untrackedFiles: boolean) {
    let index: GitIndex;
    const workingTreeFilesStats = new Map<string, Stats>;
    const statusFiles = new Map<string, FileStatusCode>;

    const pathToIndex = path.join(gitRoot, '.git/index');
    const currentBranch = getCurrentBranch(gitRoot);

    await readWorkingTree(gitRoot, argvPaths, untrackedFiles, workingTreeFilesStats);

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
