import path from "node:path";
import fs from "fs";
import { getCurrentBranch } from "../utils/getCurrentBranch";
import { writeTree } from "./write-tree";
import { Commit } from "../objects/commit";
import { parseIndex } from "../utils/parseIndex";
import { parseObject } from "../utils/parseObject";
import { FileStatusCode } from "../enums/enums";
import { headCommitIndexDiff } from "./status";
import { diffArrays } from "diff";
import { getHeadCommitFiles } from "../utils/getHeadCommitFiles";

function getParents(pathToRef: string) {
    if(!fs.existsSync(pathToRef)) return;

    const ref = fs.readFileSync(pathToRef);

    return [ref.toString()];
}

function prepareDiffOutput(gitRoot: string, currentBranch: string, parents?: string []) {
    let output = ``;
    const pathToIndex = path.join(gitRoot, '.git/index');
    const index = parseIndex(pathToIndex);

    let filesChanged = 0;
    let insertions = 0;
    let deletions = 0;
    let files = ``;

    if(!parents) {
        index.entries.forEach(entry => {
            filesChanged++; 
            const { content } = parseObject(gitRoot, entry.sha);
            insertions += content.toString().split('\n').length;
            files += ` create mode ${(entry.modeType >>> 0).toString(8)} ${entry.name}\n`; 
        });
    } else {
        const statusFiles = headCommitIndexDiff(gitRoot);

        statusFiles.forEach((value, key) => {
            switch(value) {
                case FileStatusCode.UNMODIFIED:
                    break;
                case FileStatusCode.UNTRACKED:
                    break;
                case FileStatusCode.DELETED:
                    break;
                case FileStatusCode.ADDED: {
                    const entry = index.getEntry(key);
                    const { content } = parseObject(gitRoot, entry?.sha!);

                    filesChanged++; 
                    insertions += content.toString().split('\n').length - 1;
                    files += ` create mode ${(entry?.modeType! >>> 0).toString(8)} ${entry?.name!}\n`; 
                    break;
                }
                case FileStatusCode.MODIFIED: {
                    const entry = index.getEntry(key);
                    const { content: indexFileContent } = parseObject(gitRoot, entry?.sha!);

                    const headCommitFiles = getHeadCommitFiles(gitRoot, currentBranch);
                    const headCommitFile = headCommitFiles.filter(file => file[1].path === key);
                    const { content: headCommitFileContent } = parseObject(gitRoot, headCommitFile[0][1].hash!);
                    
                    const diff = diffArrays(headCommitFileContent.toString().split('\n'), indexFileContent.toString().split('\n')); 

                    diff.forEach(change => {
                        if (change.added && change.count) {
                            insertions += change.count;
                        }
                        if (change.removed && change.count) {
                            deletions += change.count;
                        }
                    });
                    filesChanged++;
                    files += ` create mode ${(entry?.modeType! >>> 0).toString(8)} ${entry?.name!}\n`; 
                    break;
                }
            }
        });
    } 

    output += `${filesChanged} files changed${insertions > 0 ? `, ${insertions} insertions (+)` : ''}${deletions > 0 ? `, ${deletions} deletions (-)` : ''}\n`;
    output += files;
    return output;
}

export async function commit(gitRoot: string, argvMessage?: string) {
    const currentBranch = getCurrentBranch(gitRoot).trim(); 
    const pathToRef = path.join(gitRoot, '.git/refs/heads', currentBranch);
    const parents = getParents(pathToRef);

    let diffOutput = prepareDiffOutput(gitRoot, currentBranch, parents); 
    
    const treeHash = writeTree(gitRoot, true);
    const commit = new Commit(parents);
    const commitHash = await commit.createCommit(gitRoot, treeHash, argvMessage);

    fs.writeFileSync(pathToRef, commitHash.toString());
    let output = `[${currentBranch}${!parents ? ' (root-commit)' : ''} ${commitHash.substring(0, 7)}] ${commit.message}\r\n`;

    return output += diffOutput;
}
