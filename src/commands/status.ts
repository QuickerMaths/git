import path from "path";
import fs from 'fs/promises';
import { exists } from '../utils/exists';


async function processUntrackedFile(file: string, workingTreeFiles: string[]): Promise<string[]> {
    try {
        const directoryFiles = await fs.readdir(file, { recursive: true });
        return workingTreeFiles.concat(directoryFiles);
    } catch(err: any) {
        if(err.code === 'ENOTDIR') {
            workingTreeFiles.push(file);
            return workingTreeFiles;
        }
        throw Error(err);
    }
}

async function readWorkingTree(gitRoot: string, files: string[], untrackedFiles: boolean) {
    let workingTreeFiles: string[] = [];
    let startFormGitRoot = true;

    // if files are provided but one of them is '.' that refers to git root, we skip other arugments and read from git root 
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
                workingTreeFiles = await processUntrackedFile(filePath, workingTreeFiles);
            } else {
                workingTreeFiles.push(filePath);
            }
        }

        return workingTreeFiles; 
    }

    await Promise.all(files.map(async file => {
        if(await exists(file)){
            if(untrackedFiles) {
                workingTreeFiles = await processUntrackedFile(file, workingTreeFiles);
            } else {
                workingTreeFiles.push(file);
            }
        }
    }));

    return workingTreeFiles;
}

export async function gitStatus(gitRoot: string, paths: string[], untrackedFiles: boolean) {
    let indexFile: Buffer;
    let workingTreeFiles: string[];

    const pathToHead = path.join(gitRoot, '.git/HEAD');
    const pathToIndex = path.join(gitRoot, '.git/index');
    const headFile = await fs.readFile(pathToHead, 'utf-8');
    const currentBranch = path.basename(headFile);

    workingTreeFiles = await readWorkingTree(gitRoot, paths, untrackedFiles);
    console.log(workingTreeFiles); 

    try {
        await fs.access(pathToIndex);
        indexFile = await fs.readFile(pathToIndex);
    } catch { 
        return `On branch ${currentBranch}\r\nno changes commited yet`; 
    }
}
