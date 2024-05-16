import { globSync } from "glob";
import path from "path";
import * as fsSync from 'fs';
import { IWorkTreeFilesStats } from "../types/types";

export function getGitIgnore(gitRoot: string) {
    const gitIgnorePath = path.join(gitRoot, '.gitignore');
    const ignore: string[] = ['.git/**', '**/.DS_Store'];

    if(fsSync.existsSync(gitIgnorePath)) {
        const gitIgnore = fsSync.readFileSync(gitIgnorePath, 'utf-8');

        gitIgnore.split('\n').filter(line => line.trim() !== '').forEach(line => {
            if(line.startsWith('#')) return;
            ignore.push(line);
        });
    }

    return ignore;
}

export function getWorkingTreeFileStats(gitRoot: string, workingTreeFilesStats: Map<string, IWorkTreeFilesStats>, untrackedFiles: boolean, argvPath?: string) {
    const ignore = getGitIgnore(gitRoot);
    const files = globSync('**/*', {
        cwd: argvPath || gitRoot,
        nodir: !!!argvPath && !untrackedFiles,
        dot: true,
        ignore
    });

    files.forEach(file => {
        let filePath = file;
        if(argvPath) filePath = path.join(argvPath, file); 
        workingTreeFilesStats.set(filePath, { stats: fsSync.lstatSync(path.join(gitRoot, filePath)), path: filePath });
    });

    return workingTreeFilesStats;
}

