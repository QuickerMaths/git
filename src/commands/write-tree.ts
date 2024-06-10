import path from "path";
import fs from 'fs';
import { parseIndex } from "../utils/parseIndex";
import { GitIndex } from "../objects/git-index";
import { Tree } from "../objects/tree";

export function writeTree(gitRoot: string, write: boolean = true) {
    let index: GitIndex;
    const pathToIndex = path.resolve(gitRoot, '.git/index');

    if(fs.existsSync(pathToIndex)) {
        index = parseIndex(pathToIndex);
    } else {
        index = new GitIndex({ signature: 'DIRC', version: 2 }, []);
        index.write(gitRoot);
    }
    
    const tree = new Tree();
    const treeObjects = tree.buildTreeObjects(index.entries);
    tree.createTree(treeObjects);

    const treeHash = tree.treeRoot.hashTree(gitRoot, write);

    return treeHash;
}
