import path from "path";
import { FileMode } from '../enums/enums';
import { TreeObject, Tree } from '../objects/tree';
import { parseObject } from "./parseObject";

export function prepareTreeOutput(tree: Tree, recursive?: boolean, showTree?: boolean) { 
    let objectsToOutput = Array.from(tree.treeRoot.children.values());

    if(recursive && showTree) objectsToOutput = tree.getRecursiveChildren();
    if(recursive && !showTree) objectsToOutput = Array.from(tree.treeObjects.values());
    if(showTree && !recursive) return;
    
    const treeOutput = objectsToOutput.map(child => {
        const octalMode = child.mode.toString(8);
        const mode = octalMode.startsWith('4') ? `0${octalMode}` : octalMode;
        const type = Number(child.mode) === FileMode.REGULAR ? 'blob' : 'tree';
        return `${mode} ${type} ${child.hash}  ${child.path}`;
    }).join('\n');

    return treeOutput;
}

export async function processTree(gitRoot: string, tree: Tree , treeArray: TreeObject[], recursive: boolean) {
    const treeObject = treeArray.shift();
    const { content } = parseObject(gitRoot, treeObject?.hash!);

    for(let i = 1; i < content.length;) {
        let modeStart = i;
        while(content[i] !== Buffer.from(' ')[0]) {
            i++;
        }

        const mode = content.subarray(modeStart, i).toString();
        i++;

        let nameStart = i;
        while (content[i] !== Buffer.from('\0')[0]) {
            i++;
        }

        const name = content.subarray(nameStart, i).toString();
        const objectPath = path.join(treeObject?.path!, name);
        i++;

        const hash = content.subarray(i, i + 20).toString('hex')
        i += 20;

        if(mode === FileMode.DIR.toString(8)) {
            const dirObject = new TreeObject(FileMode.DIR, objectPath, name, hash); 
            if(recursive) treeArray.push(dirObject); 
            tree.createTree([dirObject]);
        } else {
            const fileObject = new TreeObject(FileMode.REGULAR, objectPath, name, hash);
            tree.createTree([fileObject]);
        }
    }

    if(treeArray.length > 0) await processTree(gitRoot, tree, treeArray, recursive);
}

