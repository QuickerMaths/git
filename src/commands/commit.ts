import path from "node:path";
import fs from "fs/promises";
import { getCurrentBranch } from "../utils/getCurrentBranch";
import { exists } from "../utils/exists";
import { writeTree } from "./write-tree";
import { Commit } from "../objects/commit";

async function getParents(pathToRef: string) {
    if(!await exists(pathToRef)) return;
    
    const ref = await fs.readFile(pathToRef);

    return [ref.toString()];
}

export async function commit(gitRoot: string, argvMessage?: string) {
    const currentBranch = getCurrentBranch(gitRoot).trim(); 
    const pathToRef = path.join(gitRoot, '.git/refs/heads', currentBranch);
    const parents = await getParents(pathToRef);

    const treeHash = await writeTree(gitRoot, true);
    const commit = new Commit(parents);
    const commitHash = await commit.createCommit(gitRoot, treeHash, argvMessage);

    await fs.writeFile(pathToRef, commitHash.toString());

    const output = `[${currentBranch} (root-commit) ${commitHash.substring(0, 7)}] ${commit.message}\r\n`;

    return output;
}
