import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { hashObject } from './commands/hash-object';
import { init } from './commands/init';
import { ensureGitRepo } from './utils/ensureGitRepo';
import { updateIndex } from './commands/update-index';
import { gitStatus } from './commands/status';
import { catFile } from './commands/cat-file';
import { writeTree } from './commands/write-tree';
import { lsTree } from './commands/ls-tree';
import { commitTree } from './commands/commit-tree';
import { commit } from './commands/commit';

async function commandWrapper(callback: () => Promise<string | string[] | Buffer | undefined | void>) {
    try {
        const output = await callback();
        if(output) {
            if(Array.isArray(output)) {
                output.forEach((line) => process.stdout.write(line + '\n'));
            } else {
                process.stdout.write(output + '\n');
            }
        } 
        process.exit(0);
    } catch(error) {
        const e = error as Error;
        process.stderr.write(e.message);
        process.exit(1);
    }
}

export function cli(args: string[]) {
    return yargs(hideBin(args))
    .command(
        'init [path]', 
        'initalizes empty git repository',
        (argv) => {
            return argv
            .positional('path', {
                describe: 'path to initialize git repository, defaults to current directory',
                default: '.'
            })
            .option('quiet', {
                alias: 'q',
                type: 'boolean',
                description: 'Print only error messages.',
                default: false
            })
        }, 
        async (argv) => await commandWrapper(() => init(argv.path, argv.quiet)) 
    )
    .command(
        'hash-object [files..]', 
        'computes the object ID value for an object with specified type with contents of the named files or stdin if --stdin option is invoked, and optionally writes the resulting objects into database', 
            (argv) => {
                return argv
                .positional('files', {
                    describe: 'files to hash',
                    default: [] 
                })
                .option('type', {
                    alias: 't',
                    type: 'string',
                    description: 'specifies type (blob | commit | tree | tag). Defaults to blob.',
                    default: 'blob'
                })
                .option('write', {
                    alias: 'w',
                    type: 'boolean',
                    description: 'actually write the object into the database',
                    default: false
                })
                .option('stdin', {
                    type: 'boolean',
                    description: 'read the object from standard input instead of the file',
                    defualt: false
                })
            },
            async (argv) => {
                const gitRoot = await ensureGitRepo()
                await commandWrapper(() => hashObject(gitRoot, argv.files, argv.type, argv.write, !!argv.stdin))
            }
    )
    .command(
        'update-index [files..]',
        'register files in the working directory to the index files',
        (argv) => {
            return argv
            .positional('files', {
                describe: 'files to update index with',
                default: []
            })
            .option('add', {
                type: 'boolean',
                description: "If specified it checks if file isn't in the index and then adds. If file is in the index already it igrnoes it",
                    default: false,
            })
        },
        async (argv) => {
            const gitRoot = await ensureGitRepo();
            await commandWrapper(() => updateIndex(gitRoot, argv.files, argv.add)); 
        }
    )
    .command(
        'status [paths..]',
        'displays paths that differences between the index file and curretn HEAD commit, path that diffirenced between the working tree and and index file, and the paths that are not being tracked by CCGit',
        (argv) => {
            return argv
            .positional('paths', {
                describe: 'file paths that status commands will display. If not specified it default to git root directory',
                default: []
            })
            .option('untracked-files', {
                alias: 'u', 
                description: 'show individual file in untracked directories',
                default: false,
                type: 'boolean'
            })
        },
        async (argv) => {
            const gitRoot = await ensureGitRepo();
            await commandWrapper(() => gitStatus(gitRoot, argv.paths, argv.untrackedFiles)); 
        }
    )
    .command(
        'cat-file [type] <object>', 
        'provides the content or the type of the object in the repository',
        (argv) => {
            return argv
            .positional('object', {
                describe: 'the sha1 hash of the object to show',
                type: 'string',
                default: '',
            })
            .positional('type', {
                describe: 'defines type of given <object>',
                choices: ['blob', 'tree', 'commit', ''] as const, 
                default: ''
            })
            .option('return-type', {
                alias: 't',
                description: 'insead of content, show the object type identified by <object>',
                type: 'boolean', 
                default: false,
            })
            .option('size', {
                alias: 's',
                description: 'instead od the content, show the object size identified by <object>',
                type: 'boolean', 
                default: false
            })
            .option('pretty-print', {
                alias: 'p',
                description: 'preety-print contents of the <object>, based on its type',
                type: 'boolean', 
                default: false
            })
        },
        async (argv) => {
            const gitRoot = await ensureGitRepo();
            await commandWrapper(() => catFile(gitRoot, argv.type, argv.object, argv.returnType, argv.size, argv.prettyPrint));
        }
    )
    .command(
        'write-tree',
        'create a tree object from current index',
        (argv) => {
            return argv
            .option('write', {
                alias: 'w',
                type: 'boolean',
                description: 'actually write the object into the database',
                default: true
            })
        },
        async (argv) => {
            const gitRoot = await ensureGitRepo();
            await commandWrapper(() => writeTree(gitRoot, argv.write));
        }
    )
    .command(
        'ls-tree <hash>',
        'lists the contents of given tree object',
        (argv) => {
            return argv
            .positional('hash', {
                describe: 'hash of a tree',
                type: 'string',
                default: ''
            })
            .option('recursive', {
                description: 'recursive into sub-trees',
                alias: 'r',
                type: 'boolean',
                default: false
            })
            .option('show-tree', {
                description: 'show tree entries even when goinf to recurse them. Has no effect when -r is not used',
                alias: 't',
                type: 'boolean',
                default: false
            })
        },
        async (argv) => {
            const gitRoot = await ensureGitRepo();
            await commandWrapper(() => lsTree(gitRoot, argv.hash, argv.recursive, argv.showTree)); 
        }
    )
    .command(
        'commit-tree <tree>',
        'create new commit object',
        (argv) => {
            return argv
            .positional('tree', {
                describe: 'tree obeject to create commit with',
                type: 'string',
                default: ''
            })
            .option('message', {
                alias: 'm',
                description: 'message that describes the commit',
                type: 'string',
                default: '',
            })
            .option('parent', { 
                alias: 'p',
                description: 'parent commit hash',
                type: 'string',
            })
        },
        async (argv) => {
            const gitRoot = await ensureGitRepo();
            await commandWrapper(() => commitTree(gitRoot, argv.tree, argv.message, argv.parent));
        }
    )
    .command(
        'commit',
        'record changes to the repository',
        (argv) => {
            return argv
            .option('message', {
                alias: 'm',
                type: 'string',
                description: 'message that describes the commit'
            })
        },
        async (argv) => {
            const gitRoot = await ensureGitRepo();
            await commandWrapper(() => commit(gitRoot, argv.message));
        }
    );
}
