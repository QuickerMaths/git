import path from "path";
import { parseIndex } from "../utils/parseIndex";
import { GitIndex } from "../objects/git-index";
import { exists } from "../utils/exists";
import { Tree } from "../objects/tree";

export async function writeTree(gitRoot: string, write: boolean = true) {
    let index: GitIndex;
    const pathToIndex = path.resolve(gitRoot, '.git/index');

    if(await exists(pathToIndex)) {
        index = await parseIndex(pathToIndex);
    } else {
        index = new GitIndex({ signature: 'DIRC', version: 2 }, []);
        await index.write(gitRoot);
    }
    
    const tree = new Tree();
    const treeObjects = tree.buildTreeObjects(index.entries);
    tree.createTree(treeObjects);

    const treeHash = tree.treeRoot.hashTree(gitRoot, write);

    return treeHash;
}
