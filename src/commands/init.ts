import fs from 'fs';
import path from 'node:path';

const defaultFilesPath = path.resolve(__dirname, '..', 'default-files')
let isReinitialized = false;

function ensureExists(dirPath: string, callback: () => void) {
    if(!fs.existsSync(dirPath)) {
        callback()
    }
}

function createGitDir(gitDirPath: string) {
    try {
        fs.mkdirSync(gitDirPath, { recursive: true });
    } catch(err: any) {
        throw Error('Unanble to create .git directory', err);
    }
}

function writeHeadFile(gitDirPath: string) {
    const filePath = path.join(gitDirPath, 'HEAD');
    const defaultHeadFile = fs.readFileSync(path.resolve(defaultFilesPath , 'HEAD'), 'utf-8');
    const writeHeadFile = () => fs.writeFileSync(filePath, defaultHeadFile, 'utf-8');

    ensureExists(filePath, writeHeadFile);
}

function writeDescriptionFile(gitDirPath: string) {
    const filePath = path.join(gitDirPath, 'description');
    const defaultDescriptionFile = fs.readFileSync(path.resolve(defaultFilesPath, 'description'), 'utf-8');
    const writeDescriptionFile = () => fs.writeFileSync(filePath, defaultDescriptionFile, 'utf-8');

    ensureExists(filePath, writeDescriptionFile);
}

function writeConfigFile(gitDirPath: string) {
    const filePath = path.join(gitDirPath, 'config');
    const defaultConfigFile = fs.readFileSync(path.resolve(defaultFilesPath, 'config'), 'utf-8');
    const writeConfigFile = () => fs.writeFileSync(filePath, defaultConfigFile, 'utf-8');

    ensureExists(filePath, writeConfigFile);
}

function createBranchesDir(gitDirPath: string) { 
    const dirPath = path.join(gitDirPath, 'branches');
    
    fs.mkdirSync(dirPath, { recursive: true });
}

function createObjectsDir(gitDirPath: string) {
    const objectsDirPath = path.join(gitDirPath, 'objects');
    fs.mkdirSync(objectsDirPath, { recursive: true })
    
    const infoDirPath = path.join(objectsDirPath, 'info');
    fs.mkdirSync(infoDirPath, { recursive: true });

    const packDirPath = path.join(objectsDirPath, 'pack');
    fs.mkdirSync(packDirPath, { recursive: true });
}

function createRefsDir(gitDirPath: string) {
    const refsDirPath = path.join(gitDirPath, 'refs');
    fs.mkdirSync(refsDirPath, { recursive: true })
    
    const tagsDirPath = path.join(refsDirPath, 'tags');
    fs.mkdirSync(tagsDirPath, { recursive: true });

    const headsDirPath = path.join(refsDirPath, 'heads');
    fs.mkdirSync(headsDirPath, { recursive: true });
}

function sendSuccessMessage(gitDirPath: string, quiet: boolean, isReinitialized: boolean) {
    if(!quiet) return `${isReinitialized ? 'Reinitialized existing' : 'Initialized empty'} git repository in ${gitDirPath}` 
}

export function init(argvPath: string, argvQuiet: boolean){
    const gitDirPath = path.resolve(process.cwd(), argvPath, '.git');

    if(fs.existsSync(gitDirPath)) {
        isReinitialized = true;
    } else {
        createGitDir(gitDirPath);
    }

    writeHeadFile(gitDirPath);
    writeDescriptionFile(gitDirPath);
    writeConfigFile(gitDirPath);
    createBranchesDir(gitDirPath);
    createObjectsDir(gitDirPath);
    createRefsDir(gitDirPath);
    return sendSuccessMessage(gitDirPath, argvQuiet, isReinitialized);
}
