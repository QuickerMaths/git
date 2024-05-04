import path from "path";
import { FileMode } from '../enums/enums';
import { TreeObject, Tree } from '../objects/tree';
import { parseObject } from "./parseObject";

export function prepareTreeOutput(tree: Tree) { 
    const treeOutput = Array.from(tree.treeRoot.children.values()).map(child => {
        const mode = child.mode.toString().startsWith('4') ? `0${child.mode}` : child.mode;
        const type = child.mode === FileMode.REGULAR ? 'blob' : 'tree';
        return `${mode} ${type} ${child.hash}  ${child.path}`;
    }).join('\n');

    return treeOutput;
}

export async function processTree(gitRoot: string, tree: Tree , treeArray: TreeObject[], recursive: boolean) {
    const treeObject = treeArray.shift();
    const { content } = await parseObject(gitRoot, treeObject?.hash!);

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

