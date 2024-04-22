import fs from 'fs/promises';
import path from 'node:path';

let isReinitialized = false;

async function ensureExists(dirPath: string, callback: () => Promise<void>) {
    try {
        await fs.access(dirPath);
    } catch {
        await callback()
    }
}

async function createGitDir(gitDirPath: string) {
    try {
        await fs.mkdir(gitDirPath, { recursive: true });
    } catch(err) {
        console.log('Unanble to create .git directory', err);
        process.exit(1);
    }
}

async function writeHeadFile(gitDirPath: string) {
    const filePath = path.join(gitDirPath, 'HEAD');
    const writeHeadFile = () => fs.writeFile(filePath, 'ref: refs/heads/master\n');

    ensureExists(filePath, writeHeadFile);
}

function sendSuccessMessage(gitDirPath: string, quiet: boolean, isReinitialized: boolean) {
    if(!quiet) console.log(`${isReinitialized ? 'Reinitialized existing' : 'Initialized empty'} git repository in`, gitDirPath);
}

export async function init(argvPath: string, argvQuiet: boolean){
    const gitDirPath = path.resolve(process.cwd(), argvPath, '.git');

    try {
        await fs.access(gitDirPath);
        isReinitialized = true;
    } catch {
        await createGitDir(gitDirPath);
    }
    await writeHeadFile(gitDirPath);
    sendSuccessMessage(gitDirPath, argvQuiet, isReinitialized);
}
