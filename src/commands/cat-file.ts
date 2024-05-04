import { Tree, TreeObject } from '../objects/tree';
import { FileMode } from '../enums/enums';
import { parseObject } from '../utils/parseObject';
import { processTree, prepareTreeOutput } from '../utils/processTree';

export async function catFile(gitRoot: string, argvType: string, argvObject: string, returnType: boolean, returnSize: boolean, prettyPrint: boolean) {
    // only one argument can be specified at a time
    let argvCount = [argvType, returnType, returnSize, prettyPrint].filter(Boolean).length;
    if (argvCount !== 1) throw Error('fatal: Invalid usage, only one argument can be specified at a time');
    if(!argvType && !returnType && !returnSize && !prettyPrint) throw Error('fatal: Invalid usage, provide one of [type] | -p | -s | -t');

    const { type, size, content } = await parseObject(gitRoot, argvObject);

    if(!!argvType.length && argvType !== type.toString()) throw Error(`fatal: Invalid type ${argvType}`);
    if(!!argvType.length && argvType === type.toString() || prettyPrint) {
        if(argvType !== 'tree') return content;
        // if type === 'tree'
        const tree = new Tree(); 
        const treeRoot = new TreeObject(FileMode.DIR, '' , '', argvObject);
        tree.treeRoot = treeRoot; 

        const treeArray = [treeRoot];
        await processTree(gitRoot, tree, treeArray, false);

        return prepareTreeOutput(tree);
    }
    if(returnSize) return size;
    if(returnType) return type;
}
