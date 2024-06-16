import fs from 'fs';
import path from "path";
import { parseIndex } from '../utils/parseIndex';
import { FileStatusCode } from "../enums/enums";
import { hashObject } from "./hash-object";
import { FgRed, ColorReset, FgGreen } from "../constants/constants";
import { getCurrentBranch } from "../utils/getCurrentBranch";
import { IFileStatus, IWorkTreeFilesStats } from "../types/types";
import { getWorkingTreeFileStats } from "../utils/getWorkingTreeFilesStats";
import { getHeadCommitFiles } from '../utils/getHeadCommitFiles';

export function headCommitIndexDiff(gitRoot: string){
    const index = parseIndex(path.join(gitRoot, '.git/index'));
    const statusFiles: Map<string, FileStatusCode> = new Map();
    const currentBranch = getCurrentBranch(gitRoot).trim(); 
    const pathToRef = path.join(gitRoot, '.git/refs/heads', currentBranch);

    if(!fs.existsSync(pathToRef)) {
        index.entries.forEach((entry) => {
            statusFiles.set(entry.name, FileStatusCode.ADDED);
        });

        return statusFiles;
    }

    const treeFiles = getHeadCommitFiles(gitRoot, currentBranch);
    treeFiles.forEach(([_name, file]) => {
        const indexEntry = index.getEntry(file.path);

        if (indexEntry) {
            statusFiles.set(file.path, indexEntry.sha === file.hash ? FileStatusCode.UNMODIFIED : FileStatusCode.MODIFIED);
        } else {
            statusFiles.set(file.path, FileStatusCode.DELETED);
        }

        index.remove(file.path);
    });

    index.entries.forEach((entry) => {
        statusFiles.set(entry.name, FileStatusCode.ADDED);
    });

    return statusFiles;
}

function workTreeIndexDiff(gitRoot:string, workingTreeFilesStats: Map<string, IWorkTreeFilesStats>) {
    const index = parseIndex(path.join(gitRoot, '.git/index'));
    const statusFiles: Map<string, FileStatusCode> = new Map();
    index.entries.map(entry => {
        if(workingTreeFilesStats.has(entry.name)) {
            const workingTreeFileHash = hashObject(gitRoot, [entry.name], 'blob', false, false)
            const fileStatus = workingTreeFileHash[0] === entry.sha ? FileStatusCode.UNMODIFIED : FileStatusCode.MODIFIED;

            statusFiles.set(entry.name, fileStatus);
        } else {
            statusFiles.set(entry.name, FileStatusCode.DELETED);
        }

        workingTreeFilesStats.delete(entry.name);
    });

    workingTreeFilesStats.forEach((_value, key) => statusFiles.set(key, FileStatusCode.UNTRACKED));

    return statusFiles;
}

export function setStatus(gitRoot: string, argvPaths: string[], untrackedFiles: boolean) {
    const fileStatus: Map<string, IFileStatus> = new Map();
    const workingTreeFilesStats: Map<string, IWorkTreeFilesStats> = new Map();
    // if argvPaths includes . path we read from gitRoot
    if(!!argvPaths.length && !argvPaths.includes('.')) {
        argvPaths.forEach(path => {
            getWorkingTreeFileStats(gitRoot, workingTreeFilesStats, untrackedFiles, path); 
        });
    } else {
        getWorkingTreeFileStats(gitRoot, workingTreeFilesStats, untrackedFiles);
    }

    const pathToIndex = path.join(gitRoot, '.git/index');

    if(!fs.existsSync(pathToIndex)) {
        workingTreeFilesStats.forEach(file => {
            fileStatus.set(file.path, {
                name: file.path,
                staging: FileStatusCode.UNTRACKED,
                workTree: FileStatusCode.UNTRACKED
            });
        });

        return fileStatus;
    }

    const headCommitDiff = headCommitIndexDiff(gitRoot);
    headCommitDiff.forEach((status, name) => {
        const file: IFileStatus = {
            name,
            staging: status,
            workTree: FileStatusCode.UNMODIFIED
        };

        fileStatus.set(name, file);
    });

    const workTreeDiff = workTreeIndexDiff(gitRoot, workingTreeFilesStats); 
    workTreeDiff.forEach((status, name) => {
        let file = fileStatus.get(name);

        // file not present in commit or index
        if (file === undefined) {
            file = {
                name,
                staging: FileStatusCode.UNTRACKED,
                workTree: FileStatusCode.UNTRACKED
            };
        } else {
            file.workTree = status;
        }

        fileStatus.set(name, file);
    });

    if(!!argvPaths.length && !argvPaths.includes('.')) {
        const fileStatusArray = Array.from(fileStatus.keys());
        for (let name of fileStatusArray) {
            if (!argvPaths.some(argvPath => {
                const relativePath = path.join(path.relative(gitRoot, process.cwd()), argvPath);
                return name.startsWith(relativePath)
            })) {
                fileStatus.delete(name);
            }
        }
    }

    return fileStatus;
}

function sendOutput(gitRoot: string, currentBranch: string, statusFiles: Map<string, IFileStatus>) {
    let output = `On branch ${currentBranch}`;
    let changesToBeCommited = ``;
    let changesNotStaged = ``;
    let untrackedFiles = ``;
    const cwd = path.relative(gitRoot, process.cwd());
    const status = Array.from(statusFiles.values()).sort((a, b) => a.name.localeCompare(b.name));
    
    status.forEach((e) => {
        const name = path.relative(cwd, e.name);

        switch (e.workTree) {
            case FileStatusCode.UNMODIFIED:
                break;
            case FileStatusCode.UNTRACKED:
                untrackedFiles += `\t${name}\r\n`;
            break;
            case FileStatusCode.DELETED:
                changesNotStaged += `\tdeleted: ${name}\r\n`;
            break;
            case FileStatusCode.MODIFIED:
                changesNotStaged += `\tmodified: ${name}\r\n`;
            break;
            default:
                throw new Error(`Invalid worktree status ${e}`);
        }

        switch (e.staging) {
            case FileStatusCode.ADDED:
                changesToBeCommited += `\tnew file: ${name}\r\n`;
            break;
            case FileStatusCode.DELETED:
                changesToBeCommited += `\tdeleted: ${name}\r\n`;
            break;
            case FileStatusCode.MODIFIED:
                changesToBeCommited += `\tmodified: ${name}\r\n`;
            break;
            case FileStatusCode.UNMODIFIED:
                case FileStatusCode.UNTRACKED:
                break;
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

export function gitStatus(gitRoot: string, argvPaths: string[], untrackedFiles: boolean) {
    const currentBranch = getCurrentBranch(gitRoot);

    const status = setStatus(gitRoot, argvPaths, untrackedFiles);
    return sendOutput(gitRoot, currentBranch, status);
} 
