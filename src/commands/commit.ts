import path from "node:path";
import fs from "fs";
import { getCurrentBranch } from "../utils/getCurrentBranch";
import { writeTree } from "./write-tree";
import { Commit } from "../objects/commit";

function getParents(pathToRef: string) {
    if(!fs.existsSync(pathToRef)) return;
    
    const ref = fs.readFileSync(pathToRef);

    return [ref.toString()];
}

export async function commit(gitRoot: string, argvMessage?: string) {
    const currentBranch = getCurrentBranch(gitRoot).trim(); 
    const pathToRef = path.join(gitRoot, '.git/refs/heads', currentBranch);
    const parents = getParents(pathToRef);

    const treeHash = writeTree(gitRoot, true);
    const commit = new Commit(parents);
    const commitHash = await commit.createCommit(gitRoot, treeHash, argvMessage);

    fs.writeFileSync(pathToRef, commitHash.toString());

    const output = `[${currentBranch} (root-commit) ${commitHash.substring(0, 7)}] ${commit.message}\r\n`;

    return output;
}
