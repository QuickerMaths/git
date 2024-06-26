import { Commit } from "../objects/commit";

export async function commitTree(gitRoot: string, argvTree: string, argvMessage?: string, argvParent?: string) {
    const commit = new Commit();

    const hash = await commit.createCommit(gitRoot, argvTree, argvMessage, argvParent);

    return hash;
}
