import path from "path";
import fs from 'fs';
import { Commit } from "../objects/commit";
import { FileMode } from "../enums/enums";
import { Tree, TreeObject } from "../objects/tree";
import { processTree } from "../utils/processTree";

export function getHeadCommitFiles(gitRoot: string, currentBranch: string) {
    const pathToRef = path.join(gitRoot, '.git/refs/heads', currentBranch);
    const headCommitHash = fs.readFileSync(pathToRef, 'utf-8');
    const commit = new Commit();

    commit.decodeCommit(gitRoot, headCommitHash.trim());

    const tree = new Tree(); 
    const treeRoot = new TreeObject(FileMode.DIR, '' , '', commit.hash);
    tree.treeRoot = treeRoot; 

    const treeArray = [treeRoot];
    processTree(gitRoot, tree, treeArray, true);

    const treeFiles = Array.from(tree.treeObjects.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return treeFiles;
}

