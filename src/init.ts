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
    const defaultHeadFile = await fs.readFile(path.resolve(__dirname, '..', 'default-files' , 'HEAD'), 'utf-8');
    const writeHeadFile = () => fs.writeFile(filePath, defaultHeadFile, 'utf-8');

    ensureExists(filePath, writeHeadFile);
}

async function writeDescriptionFile(gitDirPath: string) {
    const filePath = path.join(gitDirPath, 'description');
    const defaultDescriptionFile = await fs.readFile(path.resolve(__dirname, '..', 'default-files' , 'description'), 'utf-8');
    const writeDescriptionFile = () => fs.writeFile(filePath, defaultDescriptionFile, 'utf-8');

    ensureExists(filePath, writeDescriptionFile);
}

async function writeConfigFile(gitDirPath: string) {
    const filePath = path.join(gitDirPath, 'config');
    const defaultConfigFile = await fs.readFile(path.resolve(__dirname, '..', 'default-files' , 'config'), 'utf-8');
    const writeConfigFile = () => fs.writeFile(filePath, defaultConfigFile, 'utf-8');

    ensureExists(filePath, writeConfigFile);
}

async function createBranchesDir(gitDirPath: string) { 
    const dirPath = path.join(gitDirPath, 'branches');
    
    await fs.mkdir(dirPath, { recursive: true });
}

async function createObjectsDir(gitDirPath: string) {
    const objectsDirPath = path.join(gitDirPath, 'objects');
    await fs.mkdir(objectsDirPath, { recursive: true })
    
    const infoDirPath = path.join(objectsDirPath, 'info');
    await fs.mkdir(infoDirPath, { recursive: true });

    const packDirPath = path.join(objectsDirPath, 'pack');
    await fs.mkdir(packDirPath, { recursive: true });
}

async function createRefsDir(gitDirPath: string) {
    const refsDirPath = path.join(gitDirPath, 'refs');
    await fs.mkdir(refsDirPath, { recursive: true })
    
    const tagsDirPath = path.join(refsDirPath, 'tags');
    await fs.mkdir(tagsDirPath, { recursive: true });

    const headsDirPath = path.join(refsDirPath, 'heads');
    await fs.mkdir(headsDirPath, { recursive: true });
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
    await writeDescriptionFile(gitDirPath);
    await writeConfigFile(gitDirPath);
    await createBranchesDir(gitDirPath);
    await createObjectsDir(gitDirPath);
    await createRefsDir(gitDirPath);
    sendSuccessMessage(gitDirPath, argvQuiet, isReinitialized);
}
