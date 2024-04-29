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

    // if files are present, only read from files
    if(!!files.length) {
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
    
    // if no files are porvided read form git root dir excluding .DS_Store file and .git dir
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
