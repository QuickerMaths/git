import { FileMode } from "../enums/enums";
import { Tree, TreeObject } from "../objects/tree";
import { prepareTreeOutput, processTree } from "../utils/processTree";

export function lsTree(gitRoot: string, argvHash: string, argvRecursive: boolean, argvShowTree: boolean) {
    const tree = new Tree();
    const treeRoot = new TreeObject(FileMode.DIR, '', '', argvHash);
    tree.treeRoot = treeRoot;

    const treeArray = [treeRoot];
    processTree(gitRoot, tree, treeArray, argvRecursive);

    return prepareTreeOutput(tree, argvRecursive, argvShowTree); 
}
