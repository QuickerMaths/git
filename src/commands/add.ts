import path from "path";
import fs from 'fs';
import { globSync } from "glob";
import { updateIndex } from "./update-index";
import { getGitIgnore } from "../utils/getWorkingTreeFilesStats";

function addArgvFiles(gitRoot: string, argvFiles: string[], ignore: string[], ignoredFiles: string[]) {
    let files: string[] = [];

    argvFiles.forEach(file => {
        if(ignore.includes(file)) return ignoredFiles.push(file);
        const pathToFile = file === '.' ? process.cwd() : path.isAbsolute(file) ? file : path.join(gitRoot, file);
        if(!fs.existsSync(pathToFile)) throw Error(`fatal: ${file} did not match any files`);

        const stat = fs.statSync(pathToFile);

        if(stat.isFile()) return files.push(file); 

        const globPattern = file === '.' ? `${path.relative(gitRoot, process.cwd()) || '**'}/**` : `${file}/**`;
        const globFiles = globSync(globPattern, {
            cwd: gitRoot, 
            nodir: true,
            dot: true,
            ignore
        });

        files = files.concat(globFiles.map(globFile => {
            if(process.cwd() !== gitRoot) return globFile.split('/').slice(1).join('/');
            return globFile;
        }));
    });

    return files;
}

function outputIgnoredFiles(ignoredFiles: string[]) {
    let ignoredFilesOutput = 'The following paths are ignored by one of your .gitignore files:';

    ignoredFiles.forEach(file => ignoredFilesOutput += `\n${file}`)

    return ignoredFilesOutput;
}

export async function add(gitRoot: string, argvFiles: string[], argvAll: boolean) {
    let files: string[] = [];
    const ignoredFiles: string[] = [];
    const ignore = getGitIgnore(gitRoot);

    if(argvAll) {
        files = globSync('**/*', {
            cwd: gitRoot,
            nodir: true,
            dot: true,
            ignore
        });

        return await updateIndex(gitRoot, files, true);
    } 

    files = addArgvFiles(gitRoot, argvFiles, ignore, ignoredFiles);

    await updateIndex(gitRoot, files, true);
    if(!!ignoredFiles.length) return outputIgnoredFiles(ignoredFiles); 
}
