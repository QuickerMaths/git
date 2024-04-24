import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import { init } from './init.ts';
import { hashObject } from './hash-object.ts';
import path from 'node:path'
import fs from 'fs/promises'

async function exists(path: string) {
    try {
        await fs.access(path)
        return true
    } catch {
        return false
    }
}

async function ensureGitRepo(): Promise<string> {
  let root = process.cwd();
  let pathToGit: string;

  while (root !== '/') {
    pathToGit = path.join(root, '.git');

    if (await exists(pathToGit)) {
      return root;
    }
    root = path.dirname(root);
  }

  pathToGit = path.join(root, '.git');
  if (await exists(pathToGit)) {
    return root;
  }

  process.stderr.write(
    'fatal: not a git repository (or any of the parent directories): .git\r\n'
  );
  process.exit(1);
}

async function commandWrapper(callback: () => Promise<string | string[] | undefined | void>) {
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
        'hash-object [file]', 
        'computes the object ID value for an object with specified type with contents of the named file, and optionally writes the resulting object into database', 
            (argv) => {
                return argv
                .positional('file', {
                    describe: 'file to hash',
                    type: 'string',
                    default: ''
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
                await commandWrapper(() => hashObject(gitRoot, argv.file, argv.type, argv.write, !!argv.stdin))
            }
    )
}
